// WCAG 2.x contrast check for every text/background pair the site uses. Run: npm run contrast
// Fails (exit 1) if any pair is below its minimum: 4.5:1 normal text, 3:1 large text (≥24px, or ≥18.66px bold) / UI.
// Colours named decorative* are checked as INFO only: they may never be used for text.
import fs from 'node:fs';

const { colors: c } = JSON.parse(fs.readFileSync(new URL('../content/brand.json', import.meta.url), 'utf8'));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Semi-transparent glows behind text, blended exactly as the CSS draws them (worst case: full overlap).
const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
c.glowFooter = mix(c.primary, c.navy, 0.3); // footer + dark bands: teal glow over navy
c.glowMint = mix(c.mint, c.navy, 0.12); // mint glow over navy
c.heroScrim = mix(c.navy, c.primaryDeep, 0.55); // inner-page banner: navy → deep teal (lightest point)

const N = 4.5; // normal text
const L = 3.0; // large text / UI components
// [foreground, background, minimum, where]
const pairs = [
  ['text', 'background', N, 'body text'],
  ['text', 'surfaceAlt', N, 'text on alternate sections'],
  ['text', 'tint', N, 'text on teal tints'],
  ['text', 'mintSoft', N, 'text on mint tints'],
  ['text', 'mint', N, 'text on mint chips'],
  ['textSecondary', 'background', N, 'muted text'],
  ['textSecondary', 'surface', N, 'muted text on cards'],
  ['textSecondary', 'surfaceAlt', N, 'muted text on alternate sections'],
  ['textSecondary', 'tint', N, 'muted text on tints'],
  ['textSecondary', 'mintSoft', N, 'muted text on mint tints'],
  ['primary', 'background', N, 'links, eyebrows'],
  ['primary', 'surface', N, 'links on cards'],
  ['primary', 'surfaceAlt', N, 'links on alternate sections'],
  ['primary', 'tint', N, 'icons / links on teal tint'],
  ['primary', 'mintSoft', N, 'links on mint tint'],
  ['primaryDeep', 'tint', N, 'ghost button text'],
  ['onDark', 'primary', N, 'teal buttons'],
  ['onDark', 'primaryHover', N, 'teal button hover'],
  ['onDark', 'primaryDeep', N, 'deep teal bands'],
  ['ctaInk', 'cta', N, 'gold CTA buttons (navy text)'],
  ['ctaInk', 'ctaHover', N, 'gold CTA hover'],
  ['onDark', 'whatsapp', N, 'WhatsApp button'],
  ['onDark', 'navy', N, 'footer, hero, dark bands'],
  ['onDark', 'navySoft', N, 'cards on navy'],
  ['onDarkMuted', 'navy', N, 'footer / dark-band text'],
  ['onDarkMuted', 'navySoft', N, 'muted text on navy cards'],
  ['mintOnDark', 'navy', N, 'eyebrows, icons on navy'],
  ['cta', 'navy', N, 'gold accents on navy (stars, numbers)'],
  ['onDarkMuted', 'glowFooter', N, 'footer text over the teal glow'],
  ['onDarkMuted', 'glowMint', N, 'dark-band text over the mint glow'],
  ['onDarkMuted', 'heroScrim', N, 'inner-page banner intro (worst point of gradient)'],
  ['warningText', 'warningSoft', N, 'Draft badge'],
  ['warning', 'surface', N, 'closed-now, errors (no red)'],
  ['warning', 'tint', N, 'closed-now on tint'],
  ['success', 'surface', N, 'open now'],
  ['success', 'mintSoft', N, 'open-now chip'],
  ['primary', 'border', 1.0, 'INFO: border colour (non-text)'],
  ['mint', 'background', L, 'INFO: mint — decoration only on light backgrounds, never text'],
  ['cta', 'background', L, 'INFO: gold — fills only on light backgrounds, never text'],
];

let fail = 0;
for (const [fg, bg, min, where] of pairs) {
  if (!c[fg] || !c[bg]) throw new Error(`unknown colour ${fg} or ${bg}`);
  const r = ratio(c[fg], c[bg]);
  const info = where.startsWith('INFO');
  const ok = r >= min;
  if (!ok && !info) fail++;
  console.log(`${ok ? 'PASS' : info ? 'info' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} ${c[fg]} on ${bg} ${c[bg]}  — ${where}`);
}
console.log(fail ? `\n${fail} pair(s) below WCAG AA` : '\nAll text pairs meet WCAG AA.');
process.exitCode = fail ? 1 : 0;
