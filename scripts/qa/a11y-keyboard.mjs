// TEST-ONLY keyboard + reduced-motion checks. Usage: node scripts/qa/a11y-keyboard.mjs http://localhost:3100
import puppeteer from 'puppeteer-core';

const base = process.argv[2] ?? 'http://localhost:3100';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  const s = getComputedStyle(a);
  return { tag: a.tagName, text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 40), outline: s.outlineStyle !== 'none' && s.outlineWidth !== '0px', inDialog: !!a.closest('[role=dialog]') };
});

// 1) Keyboard: skip link, visible focus, open booking with Enter, trap, Esc closes, focus returns.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('spdc.bookingPopup', 'closed'));
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  let a = await active(page);
  check('first Tab = skip link, visibly focused', a.text === 'Skip to content' && a.outline, JSON.stringify(a));
  await page.keyboard.press('Enter');
  a = await active(page);
  check('skip link moves focus to <main>', a.tag === 'MAIN', a.tag);
  // Tab until the header "Book now" button
  // Fresh page: after the skip link Chrome continues sequential focus from <main>.
  await page.goto(`${base}/`, { waitUntil: 'load' });
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    await page.keyboard.press('Tab');
    a = await active(page);
    if (a.text === 'Book Appointment' && !a.inDialog) found = true;
  }
  check('header "Book Appointment" reachable by Tab with visible focus', found && a.outline, JSON.stringify(a));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await wait(2500);
  a = await active(page);
  check('dialog opens with focus inside', a.inDialog, JSON.stringify(a));
  let escaped = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (!(await active(page)).inDialog) escaped = true;
  }
  check('focus trapped in dialog (40 Tabs)', !escaped);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // activates a chip or control inside the dialog
  await page.keyboard.press('Escape');
  await wait(300);
  const open = await page.$('[role=dialog]');
  a = await active(page);
  check('Esc closes dialog and focus returns to the opener', !open && a.text === 'Book Appointment', JSON.stringify(a));
  // FAQ accordion by keyboard
  await page.goto(`${base}/faqs`, { waitUntil: 'load' });
  await page.focus('summary');
  await page.keyboard.press('Enter');
  const opened = await page.$eval('details', (d) => d.open);
  check('FAQ accordion opens with Enter', opened);
  // Mobile menu by keyboard
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.focus('button[aria-controls=mobile-menu]');
  await page.keyboard.press('Enter');
  const expanded = await page.$eval('button[aria-controls=mobile-menu]', (b) => b.getAttribute('aria-expanded'));
  await page.keyboard.press('Escape');
  const collapsed = await page.$eval('button[aria-controls=mobile-menu]', (b) => b.getAttribute('aria-expanded'));
  check('mobile menu toggles by keyboard, Esc closes', expanded === 'true' && collapsed === 'false', `${expanded}/${collapsed}`);
  await page.close();
}

// 2) Reduced motion: no hidden reveal content, no floating animation.
{
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('spdc.bookingPopup', 'closed'));
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await wait(1000);
  const r = await page.evaluate(() => ({
    jsReveal: document.documentElement.classList.contains('js-reveal'),
    hidden: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length,
    floatDurations: [...document.querySelectorAll('.animate-float')].map((e) => getComputedStyle(e).animationDuration),
  }));
  check('reduced motion: reveal disabled, all content visible', !r.jsReveal && r.hidden === 0, JSON.stringify(r));
  check('reduced motion: floating chips not animated', r.floatDurations.every((d) => parseFloat(d) < 0.001), r.floatDurations.join(','));
  await page.close();
}

await browser.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  → ${r.detail}`}`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
