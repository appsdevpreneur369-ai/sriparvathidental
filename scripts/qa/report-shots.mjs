// Screenshots for the handover report (docs/screenshots). Usage:
// node scripts/qa/report-shots.mjs http://localhost:3100 docs/screenshots [compareUrl]
// Home desktop + mobile, booking popup, doctor page, and (optionally) a side-by-side with another site's home.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const [base = 'http://localhost:3100', out = 'docs/screenshots', compare] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(url, file, { width, height, full = false, mobile = false, popupClosed = true, before } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  if (popupClosed) await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('spdc.bookingPopup', 'closed'); } catch {} });
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await wait(1200);
  if (full) { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); } window.scrollTo(0, 0); }); await wait(1000); }
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible')));
  await wait(900);
  if (before) await before(page);
  // Chrome tiles (repeats) captures taller than ~16384 device px; cap long pages instead of producing a broken image.
  const maxCss = Math.floor(16000 / (mobile ? 2 : 1));
  const tall = full && (await page.evaluate(() => document.documentElement.scrollHeight)) > maxCss;
  await page.screenshot({ path: `${out}/${file}`, ...(tall ? { clip: { x: 0, y: 0, width, height: maxCss }, captureBeyondViewport: true } : { fullPage: full }) });
  await page.close();
}

await shoot(`${base}/`, 'home-desktop-1280.png', { width: 1280, height: 900, full: true });
await shoot(`${base}/`, 'home-mobile-390.png', { width: 390, height: 844, full: true, mobile: true });
await shoot(`${base}/doctors/dr-ramakanth`, 'doctor-page-1280.png', { width: 1280, height: 900, full: true });
await shoot(`${base}/`, 'booking-popup-auto-1280.png', { width: 1280, height: 900, popupClosed: false, before: async (p) => { await p.waitForSelector('[role=dialog]', { timeout: 20000 }); await wait(2500); } });
await shoot(`${base}/`, 'booking-popup-mobile-390.png', { width: 390, height: 844, mobile: true, before: async (p) => { await p.click('div.fixed button[aria-haspopup=dialog]'); await p.waitForSelector('[role=dialog]'); await wait(2500); } });

if (compare) {
  await shoot(`${base}/`, '_spdc-fold.png', { width: 1280, height: 900 });
  await shoot(compare, '_other-fold.png', { width: 1280, height: 900 });
  const label = (t) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="60"><rect width="1280" height="60" fill="#111"/><text x="24" y="40" font-family="Segoe UI, Arial" font-size="26" fill="#fff">${t}</text></svg>`);
  await sharp({ create: { width: 2600, height: 980, channels: 3, background: '#ffffff' } })
    .composite([
      { input: label('SPDC — Sri Parvathi Dental Clinic (this build)'), left: 10, top: 10 },
      { input: `${out}/_spdc-fold.png`, left: 10, top: 70 },
      { input: label('Comparison site (read-only view)'), left: 1310, top: 10 },
      { input: `${out}/_other-fold.png`, left: 1310, top: 70 },
    ])
    .png()
    .toFile(`${out}/spdc-vs-other-home.png`);
  fs.rmSync(`${out}/_spdc-fold.png`);
  fs.rmSync(`${out}/_other-fold.png`);
}
await browser.close();
console.log(fs.readdirSync(out).join('\n'));
