// TEST-ONLY end-to-end booking on the website against the LOCAL ClinicFlow stack (never staging/production).
// Usage: node scripts/qa/e2e-booking.mjs http://localhost:3300 qa/e2e
// Needs the site built/run with .env.local (NEXT_PUBLIC_CLINICFLOW_API_URL=http://localhost:8089/api/v1,
// NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=sri-parvathi-dental-clinic) and the local API with SMS in dry-run (OTP 123456).
// Every scenario is a pass/fail check; exit code 1 if any fails.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const [base = 'http://localhost:3300', out = 'qa/e2e'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
const check = (scenario, pass, detail = {}) => {
  results.push({ scenario, pass, ...detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${scenario}`);
};
const stamp = Date.now();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const inDialog = (scope) => (scope === 'main' ? 'main' : '[role=dialog]');
const click = async (page, text, scope) => (await page.waitForSelector(`${inDialog(scope)} ::-p-text(${text})`, { timeout: 25000 })).click();
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });

/** Reason → day → time → details (→ OTP). Returns the result heading or the error text. */
async function walk(page, prefix, { reason = 'Gums bleed when brushing', email, phone, expectOtp = true, scope } = {}) {
  const S = inDialog(scope);
  try {
    if (reason) await click(page, reason, scope);
    const day = await page.waitForSelector(`${S} [role=listbox] [role=option]:nth-child(3)`, { timeout: 25000 });
    await day.click();
    await page.waitForSelector(`${S} [role=radiogroup][aria-label=Time] [role=radio]`, { timeout: 25000 });
    const slots = await page.$$(`${S} [role=radiogroup][aria-label=Time] [role=radio]`);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const slotText = await slot.evaluate((e) => e.textContent);
    await slot.click();
    await click(page, 'Continue', scope);
    await page.waitForSelector('#bk-name');
    await wait(400);
    await page.type('#bk-name', 'Test Patient');
    // A fresh number per booking: core matches an existing patient by phone before it checks the email.
    await page.type('#bk-phone', phone ?? `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`);
    await page.type('#bk-email', email ?? `e2e+${stamp}-${prefix}@spdc.test`);
    await page.click(`${S} input[type=checkbox]`);
    await page.click(`${S} button[type=submit]`);
    if (expectOtp) {
      await page.waitForSelector('#bk-otp', { timeout: 25000 });
      await wait(400);
      await page.type('#bk-otp', '123456');
      await page.click(`${S} button[type=submit]`);
    }
    const res = await page.waitForFunction(
      (sel) => {
        const d = document.querySelector(sel);
        const h = d?.querySelector('h2')?.textContent ?? '';
        const alert = d?.querySelector('[role=alert]')?.textContent ?? '';
        return /confirmed|Request sent|received|on WhatsApp/i.test(h) ? { heading: h } : alert ? { error: alert } : false;
      },
      { timeout: 40000 },
      S,
    );
    const r = await res.jsonValue();
    await shot(page, `${prefix}-result`);
    return { slotText, ...r };
  } catch (e) {
    await shot(page, `${prefix}-FAILED`);
    return { error: String(e).slice(0, 300) };
  }
}

// 1) Desktop: auto-popup after ~12 s → live ClinicFlow booking with SMS code → confirmed.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const t0 = Date.now();
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.waitForSelector('[role=dialog]', { timeout: 30000 });
  const openedAfter = Math.round((Date.now() - t0) / 100) / 10;
  check('popup auto-opens once, after ~12 s (not on load)', openedAfter >= 11, { openedAfter });
  await wait(2500); // health check
  const r = await walk(page, '1-clinicflow');
  check('live booking (reason → day → slot → details → OTP) is confirmed', /confirmed/i.test(r.heading ?? ''), r);

  // Same email again: it now has a patient login → honest message, never "slot taken".
  const repeat = `e2e+${stamp}-repeat@spdc.test`;
  for (const n of [1, 2]) {
    await page.click('[role=dialog] button[aria-label="Close booking"]');
    await page.click('header button[aria-haspopup=dialog]');
    await page.waitForSelector('[role=dialog]');
    await wait(2500);
    const rr = await walk(page, `1b-repeat-${n}`, { email: repeat });
    if (n === 2) check('second booking with the same email → "already has a patient account"', /already has a patient account/i.test(rr.error ?? ''), rr);
  }
  await page.keyboard.press('Escape');
  await page.goto(`${base}/about`, { waitUntil: 'load' });
  await wait(14000);
  check('popup does not auto-open a second time in the session', !(await page.$('[role=dialog]')));
  await page.close();
}

// 2) Phone: no auto-popup; the floating dock opens booking. Doctors API down → enquiry (a real lead), clearly a request.
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', (rq) => (/\/api\/clinicflow\/clinics\/[0-9a-f-]{36}\/doctors$/.test(rq.url()) ? rq.respond({ status: 503, contentType: 'application/json', body: '{"success":false,"error":{"code":"DOWN"}}' }) : rq.continue()));
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await wait(14000);
  check('no auto-popup on phones', !(await page.$('[role=dialog]')));
  await page.click('div.fixed button[aria-haspopup=dialog]');
  await page.waitForSelector('[role=dialog]');
  await wait(2500);
  const r = await walk(page, '2-enquiry', { expectOtp: false });
  check('doctors API down → enquiry fallback sends a request (not a booking)', /Request sent|received/i.test(r.heading ?? ''), r);
  await ctx.close();
}

// 3) Whole API unreachable → WhatsApp fallback (number approved 20 Oct 2026): a pre-filled wa.me message, never "booked".
//    (With a placeholder WhatsApp number the same case shows "not available" + Call; covered by the unit tests.)
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (rq) => (/\/api\/clinicflow\/|localhost:8089/.test(rq.url()) ? rq.abort() : rq.continue()));
  await page.goto(`${base}/book?problem=toothache`, { waitUntil: 'load' });
  await wait(3500);
  const r = await walk(page, '3-whatsapp', { reason: null, expectOtp: false, scope: 'main' });
  const href = await page.$eval('main a[href^="https://wa.me/"]', (a) => a.href).catch(() => '');
  await shot(page, '3-whatsapp');
  check('API down → WhatsApp fallback: pre-filled message to +91 78939 36489, never a success', /on WhatsApp/i.test(r.heading ?? '') && !/confirmed/i.test(r.heading ?? '') && href.startsWith('https://wa.me/917893936489?text='), { ...r, href: href.slice(0, 40) });
  await ctx.close();
}

// 4) Deep link with a single dentist: /book?problem=… skips straight to "Pick a day".
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/book?problem=wisdom-tooth`, { waitUntil: 'load' });
  await page.waitForSelector('main ::-p-text(Pick a day)', { timeout: 25000 }).catch(() => null);
  const text = await page.$eval('main', (m) => m.innerText);
  check('deep link pre-fills the reason and skips the doctor step', /Pick a day/.test(text) && !/Choose your doctor/.test(text));
  await page.close();
}

await browser.close();
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} booking checks passed`);
process.exitCode = failed ? 1 : 0;
