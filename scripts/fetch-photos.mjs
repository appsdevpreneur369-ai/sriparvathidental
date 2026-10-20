// Builds public/images/photos/ from two kinds of source:
//  1. The clinic's OWN photos in images/ (supplied by the account owner, 20 Oct 2026): converted locally, no network.
//  2. Representative stock photos (Unsplash License / Pexels License: free to use, no attribution required; sources
//     still recorded in content/photo-credits.json). PLACEHOLDERS ONLY: none of them show Sri Parvathi Dental Clinic,
//     its staff or Dr. Ramakanth. Every photo with people shows Indian faces (owner's request, 20 Oct 2026), across
//     age groups: children, teens, young adults, parents and grandparents.
// Unsplash picks: unsplash.com search, free licence filter (no Unsplash+). Pexels picks: pexels.com search, 20 Oct 2026.
// Run: node scripts/fetch-photos.mjs   (needs internet; only when changing the selection)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

// Clinic's own photos: images/<file> → [output file, description]. Kept at their supplied size (never upscaled).
const OWN = {
  'clinic-1.png': ['clinic-treatment-rooms.jpg', "Sri Parvathi Dental Clinic's two treatment rooms, decorated with marigold garlands"],
  'clinic-2.png': ['clinic-waiting-area.jpg', "Sri Parvathi Dental Clinic's waiting area, with a treatment room beyond"],
};

// Unsplash CDN id → [output file, width, height, description]
const UNSPLASH = {
  '1657912230234-87f45165424d': ['hero-family.jpg', 1600, 1200, 'Smiling young Indian family outdoors'],
  '1777793389944-f7165259a05c': ['treat-root-canal.jpg', 1200, 800, 'Cross-section tooth model showing the root canals'],
  '1771442873038-dda05b6ca447': ['treat-extraction.jpg', 1200, 800, 'Sterile dental instruments in a gloved hand'],
  '1687811233721-70ebc025f8c0': ['treat-crowns.jpg', 1200, 800, 'Row of dental crowns on a dark background'],
  '1588776814546-1ffcf47267a5': ['treat-implants.jpg', 1200, 800, 'Dental X-ray scans on a light box'],
  '1562330743-fbc6ef07ca78': ['treat-dentures.jpg', 1200, 800, 'Partial denture on a dental model'],
  '1720685193942-5a1c5ac7fd80': ['treat-braces.jpg', 1200, 800, 'Dental models with clear aligners and braces'],
  '1681939282781-341ac4f61996': ['article-root-canal-pain.jpg', 1200, 750, 'Patient in a dental chair during treatment'],
  '1580471260026-2a8acbc7c7a7': ['article-missing-tooth.jpg', 1200, 750, 'Smiling elderly Indian woman'],
  '1607613009820-a29f7bb81c04': ['space-toothbrushes.jpg', 1200, 900, 'Bamboo toothbrushes in a glass jar'],
  '1659352790654-058e9077a4f4': ['smile-family.jpg', 1200, 900, 'Cheerful Indian family of four'],
};

// Pexels photo id → [output file, width, height, description]
const PEXELS = {
  8224633: ['treat-general.jpg', 1200, 800, 'Indian dentist checking a young boy’s teeth'],
  28357241: ['treat-kids.jpg', 1200, 800, 'Indian boy smiling while brushing his teeth'],
  8720868: ['treat-cosmetic.jpg', 1200, 800, 'Young Indian woman with a bright, natural smile'],
  12474261: ['treat-gums.jpg', 1200, 800, 'Close-up of a healthy smile, teeth and gums'],
  8224659: ['article-first-visit.jpg', 1200, 750, 'Indian boy in the dental chair at a check-up'],
  33313773: ['article-sensitive-teeth.jpg', 1200, 750, 'Indian girl laughing while brushing her teeth'],
  18557359: ['smile-young-woman.jpg', 1200, 900, 'Young Indian woman in a blue saree, smiling'],
  29125196: ['smile-woman.jpg', 1200, 1400, 'Young Indian woman smiling outdoors'],
  30768834: ['smile-teen.jpg', 1200, 900, 'Smiling Indian teenage girl'],
  18394078: ['smile-grandparents.jpg', 1200, 900, 'Indian grandparents laughing with their grandchild'],
  6472469: ['smile-elder.jpg', 1200, 900, 'Elderly Indian man in an orange turban, smiling warmly'],
};

const outDir = path.join(root, 'public', 'images', 'photos');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const credits = {};
const own = {};

for (const [src, [file, description]] of Object.entries(OWN)) {
  await sharp(path.join(root, 'images', src)).rotate().jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(outDir, file));
  own[file] = { source: `images/${src}`, description };
  console.log(file, '(clinic)');
}

async function save(url, file, w, h, position) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  // .rotate() applies EXIF orientation; output carries no EXIF/GPS metadata.
  await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize(w, h, { fit: 'cover', position }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(outDir, file));
  console.log(file);
}
for (const [id, [file, w, h, description]] of Object.entries(UNSPLASH)) {
  await save(`https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces,entropy&q=82&fm=jpg`, file, w, h, 'centre');
  credits[file] = { source: 'Unsplash', license: 'Unsplash License (https://unsplash.com/license)', cdn: `https://images.unsplash.com/photo-${id}`, description };
}
for (const [id, [file, w, h, description]] of Object.entries(PEXELS)) {
  // Pexels' CDN crops from the centre, so take a large original and let sharp keep the faces in frame.
  await save(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`, file, w, h, sharp.strategy.attention);
  credits[file] = { source: 'Pexels', license: 'Pexels License (https://www.pexels.com/license/)', page: `https://www.pexels.com/photo/${id}/`, description };
}

fs.writeFileSync(
  path.join(root, 'content', 'photo-credits.json'),
  `${JSON.stringify(
    {
      _note: "Stock photos (Unsplash / Pexels licences) are REPRESENTATIVE placeholders, not Sri Parvathi Dental Clinic or its doctor; all people shown are Indian. 'own' lists the clinic's own photos. Generated by scripts/fetch-photos.mjs.",
      own,
      photos: credits,
    },
    null,
    2,
  )}\n`,
);
