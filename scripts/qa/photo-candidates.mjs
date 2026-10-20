// Helper: search Unsplash (free, non-premium photos only) and build labelled contact sheets to choose from.
// Usage: node scripts/qa/photo-candidates.mjs qa/cands "<slot>=<query>" ...
import fs from 'node:fs';
import sharp from 'sharp';

const [out = 'qa/cands', ...specs] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const spec of specs) {
  const [slot, query] = spec.split('=');
  const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`, { headers: { Accept: 'application/json' } });
  const j = await res.json();
  const free = j.results.filter((r) => !r.premium && !r.plus).slice(0, 12);
  const tiles = [];
  const meta = [];
  for (const [i, r] of free.entries()) {
    const buf = Buffer.from(await (await fetch(`${r.urls.raw}&w=400&h=260&fit=crop&q=60&fm=jpg`)).arrayBuffer());
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="30"><rect width="400" height="30" fill="#000"/><text x="8" y="21" font-family="Arial" font-size="16" fill="#fff">${i}: ${r.id}</text></svg>`);
    tiles.push({ input: await sharp(buf).resize(400, 260).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer(), left: (i % 4) * 405, top: Math.floor(i / 4) * 265 });
    meta.push({ i, id: r.id, alt: r.alt_description, user: r.user?.name, link: r.links?.html, raw: r.urls.raw });
  }
  const rows = Math.ceil(tiles.length / 4) || 1;
  await sharp({ create: { width: 1620, height: rows * 265, channels: 3, background: '#fff' } }).composite(tiles).jpeg({ quality: 70 }).toFile(`${out}/${slot}.jpg`);
  fs.writeFileSync(`${out}/${slot}.json`, JSON.stringify(meta, null, 2));
  console.log(slot, meta.length);
}
