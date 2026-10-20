import 'server-only';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { siteBrand } from './content';

// next/font must be declared statically; brand.json picks from this registry by name (max 2 fonts).
// display: 'swap' so the chosen fonts always appear; next/font preloads both and uses metric-matched fallbacks.
// Headings: Fraunces (soft, editorial serif). Body: Plus Jakarta Sans (clear, modern sans). Both variable fonts.
const fraunces = Fraunces({ subsets: ['latin'], weight: 'variable', variable: '--font-fraunces', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: 'variable', variable: '--font-jakarta', display: 'swap' });

const registry: Record<string, { variable: string; cssVar: string; fallback: string }> = {
  Fraunces: { variable: fraunces.variable, cssVar: '--font-fraunces', fallback: "Georgia, 'Times New Roman', serif" },
  'Plus Jakarta Sans': { variable: jakarta.variable, cssVar: '--font-jakarta', fallback: "system-ui, 'Segoe UI', Arial, sans-serif" },
};

function font(name: string) {
  const f = registry[name];
  if (!f) throw new Error(`brand.json font "${name}" is not registered in src/lib/theme.ts`);
  return f;
}

const heading = font(siteBrand.fonts.heading);
const body = font(siteBrand.fonts.body);

export const fontClassNames = [heading.variable, body.variable].join(' ');

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** :root CSS variables generated from brand.json (colours as "r g b" so Tailwind opacity modifiers work). */
export const themeCss = `:root{${Object.entries(siteBrand.colors)
  .map(([k, v]) => `--c-${k}:${hexToRgb(v)};`)
  .join('')}--radius:${siteBrand.radius};--font-heading:var(${heading.cssVar}),${heading.fallback};--font-body:var(${body.cssVar}),${body.fallback};}`;
