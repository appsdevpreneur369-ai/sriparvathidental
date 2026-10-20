// Slices a tall full-page screenshot into viewable segments: node scripts/qa/slice-shot.mjs <png> [segmentHeight]
import sharp from 'sharp';
const [file, seg = '1400'] = process.argv.slice(2);
const meta = await sharp(file).metadata();
const h = Number(seg);
const n = Math.ceil(meta.height / h);
for (let i = 0; i < n; i++) {
  const top = i * h;
  await sharp(file).extract({ left: 0, top, width: meta.width, height: Math.min(h, meta.height - top) }).jpeg({ quality: 70 }).toFile(file.replace(/\.png$/, `-part${i + 1}.jpg`));
}
console.log(`${n} parts (${meta.width}x${meta.height})`);
