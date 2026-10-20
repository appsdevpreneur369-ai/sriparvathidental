// Downloads SPDC's representative stock photographs (Unsplash License: free to use, no attribution required;
// sources still recorded in content/photo-credits.json). PLACEHOLDERS ONLY: none of these show Sri Parvathi Dental
// Clinic, its building or Dr. Ramakanth. Replace with the clinic's own photos when they arrive (PENDING_ITEMS.md).
// Selected 20 Oct 2026 from unsplash.com search pages (free licence filter, no Unsplash+); downloaded from the
// public image CDN. Run: node scripts/fetch-photos.mjs   (needs internet; only when changing the selection)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
// Unsplash CDN id → [output file, width, height, description]
const PHOTOS = {
  '1657912230234-87f45165424d': ['hero-family.jpg', 1600, 1200, 'Smiling young family outdoors'],
  '1663755489920-5e09f66d011a': ['treat-general.jpg', 1200, 800, 'Dental check-up in a modern clinic'],
  '1777793389944-f7165259a05c': ['treat-root-canal.jpg', 1200, 800, 'Cross-section tooth model showing the root canals'],
  '1771442873038-dda05b6ca447': ['treat-extraction.jpg', 1200, 800, 'Sterile dental instruments in a gloved hand'],
  '1677026010083-78ec7f1b84ed': ['treat-gums.jpg', 1200, 800, 'Close-up of healthy gums and teeth'],
  '1687811233721-70ebc025f8c0': ['treat-crowns.jpg', 1200, 800, 'Row of dental crowns on a dark background'],
  '1588776814546-1ffcf47267a5': ['treat-implants.jpg', 1200, 800, 'Dental X-ray scans on a light box'],
  '1562330743-fbc6ef07ca78': ['treat-dentures.jpg', 1200, 800, 'Partial denture on a dental model'],
  '1720685193942-5a1c5ac7fd80': ['treat-braces.jpg', 1200, 800, 'Dental models with clear aligners and braces'],
  '1780327065569-b2205c22104e': ['treat-kids.jpg', 1200, 800, 'Young child happily brushing their teeth'],
  '1769559893692-c6d0623bf8e4': ['treat-cosmetic.jpg', 1200, 800, 'Close-up of a bright, even smile'],
  '1681939282781-341ac4f61996': ['article-root-canal-pain.jpg', 1200, 750, 'Patient in a dental chair during treatment'],
  '1609840113564-ab4aba4956c4': ['article-sensitive-teeth.jpg', 1200, 750, 'Smiling person brushing their teeth'],
  '1694286068431-569c90a6df72': ['article-first-visit.jpg', 1200, 750, 'Small child holding a toothbrush'],
  '1580471260026-2a8acbc7c7a7': ['article-missing-tooth.jpg', 1200, 750, 'Smiling elderly woman'],
  '1629909613654-28e377c37b09': ['space-modern-clinic.jpg', 1600, 1000, 'Bright, modern dental clinic with treatment chairs'],
  '1704455306251-b4634215d98f': ['space-treatment-room.jpg', 1200, 900, 'Clean treatment room with a dental chair'],
  '1598256989800-fe5f95da9787': ['space-dental-chair.jpg', 1200, 900, 'Dental chair with equipment in a bright room'],
  '1759262151080-e05ba1c6294f': ['space-waiting-area.jpg', 1200, 900, 'Calm, softly lit waiting area'],
  '1607613009820-a29f7bb81c04': ['space-toothbrushes.jpg', 1200, 900, 'Bamboo toothbrushes in a glass jar'],
  '1785860817740-c95735ba03b1': ['smile-mirror.jpg', 1200, 900, 'Young woman smiling at herself in a hand mirror'],
  '1659352790654-058e9077a4f4': ['smile-family.jpg', 1200, 900, 'Cheerful family of four'],
  '1617812191081-2a24e3f30e45': ['smile-woman.jpg', 1200, 1400, 'Woman laughing with a natural smile'],
};

const outDir = path.join(root, 'public', 'images', 'photos');
fs.mkdirSync(outDir, { recursive: true });
const credits = {};
for (const [id, spec] of Object.entries(PHOTOS)) {
  if (!spec) continue;
  const [file, w, h, description] = spec;
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces,entropy&q=82&fm=jpg`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const img = Buffer.from(await res.arrayBuffer());
  // .rotate() applies EXIF orientation; output carries no EXIF/GPS metadata.
  await sharp(img).rotate().resize(w, h, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(outDir, file));
  credits[file] = { source: 'Unsplash', license: 'Unsplash License (https://unsplash.com/license)', cdn: `https://images.unsplash.com/photo-${id}`, description };
  console.log(file);
}
fs.writeFileSync(
  path.join(root, 'content', 'photo-credits.json'),
  `${JSON.stringify({ _note: 'Representative stock photos (Unsplash License). PLACEHOLDERS: not photos of Sri Parvathi Dental Clinic or its doctor. Logged in PENDING_ITEMS.md.', photos: credits }, null, 2)}\n`,
);
