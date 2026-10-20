// Pure content parsing + cross-reference checks (no fs, no server-only) so unit tests can run them on fixtures.
import type { z } from 'zod';
import {
  AboutSchema, BookingSchema, BrandSchema, ClinicSchema, DoctorsFileSchema, EmergencySchema, FaqsSchema, GallerySchema,
  HomeSchema, ImagesSchema, NavigationSchema, PagesSchema, PlanSchema, PortalSchema, RoutingSchema, ServicesSchema, SocialSchema,
} from './schemas';

export class ContentError extends Error {
  constructor(file: string, detail: string) {
    super(`content/${file}: ${detail}`);
    this.name = 'ContentError';
  }
}

export function parseFile<T extends z.ZodTypeAny>(file: string, schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new ContentError(file, issues);
  }
  return r.data;
}

export const FILES = {
  'clinic.json': ClinicSchema,
  'brand.json': BrandSchema,
  'plan.json': PlanSchema,
  'portal.json': PortalSchema,
  'social.json': SocialSchema,
  'doctors.json': DoctorsFileSchema,
  'services.json': ServicesSchema,
  'routing.json': RoutingSchema,
  'booking.json': BookingSchema,
  'home.json': HomeSchema,
  'about.json': AboutSchema,
  'faqs.json': FaqsSchema,
  'emergency.json': EmergencySchema,
  'gallery.json': GallerySchema,
  'images.json': ImagesSchema,
  'navigation.json': NavigationSchema,
  'pages.json': PagesSchema,
} as const;

type Files = typeof FILES;
export type RawContent = { [K in keyof Files]: unknown };
export type SiteContent = { [K in keyof Files]: z.infer<Files[K]> };

export function parseAll(raw: RawContent): SiteContent {
  const out = {} as Record<string, unknown>;
  for (const [file, schema] of Object.entries(FILES)) out[file] = parseFile(file, schema, raw[file as keyof RawContent]);
  const content = out as SiteContent;
  const problems = checkReferences(content);
  if (problems.length) throw new ContentError('(cross-references)', problems.join('; '));
  return content;
}

/** Every id one file uses must exist in the file that defines it. Returns human-readable problems. */
export function checkReferences(c: SiteContent, articleRefs: { slug: string; image: string; reviewedBy: string }[] = []): string[] {
  const problems: string[] = [];
  const doctorIds = new Set(c['doctors.json'].doctors.map((d) => d.id));
  const categorySlugs = new Set(c['services.json'].categories.map((x) => x.slug));
  const imageIds = new Set(Object.keys(c['images.json'].images));
  const need = (ok: boolean, msg: string) => !ok && problems.push(msg);

  const doctors = c['doctors.json'].doctors;
  need(new Set(doctors.map((d) => d.slug)).size === doctors.length, 'doctors.json: duplicate doctor slug');
  need(doctorIds.size === doctors.length, 'doctors.json: duplicate doctor id');
  const allSlugs = doctors.flatMap((d) => [d.slug, ...d.previousSlugs]);
  need(new Set(allSlugs).size === allSlugs.length, 'doctors.json: a previousSlug clashes with a current slug');
  need(doctors.filter((d) => d.isHead).length <= 1, 'doctors.json: more than one isHead doctor');
  for (const d of doctors)
    for (const ph of [d.photo, d.photoSecondary])
      if (ph) {
        need(imageIds.has(ph), `doctors.json ${d.id}: photo "${ph}" not in images.json`);
        // Never present a stock photo as one of our doctors.
        need(!c['images.json'].images[ph]?.credit, `doctors.json ${d.id}: photo "${ph}" is a stock photo`);
      }

  for (const cat of c['services.json'].categories) {
    for (const id of cat.doctors) need(doctorIds.has(id), `services.json ${cat.slug}: unknown doctor "${id}"`);
    for (const s of cat.subTreatments) for (const id of s.doctors ?? []) need(doctorIds.has(id), `services.json ${cat.slug}/${s.slug}: unknown doctor "${id}"`);
  }
  need(categorySlugs.size === c['services.json'].categories.length, 'services.json: duplicate category slug');
  for (const p of c['routing.json'].problems) {
    for (const id of p.doctors) need(doctorIds.has(id), `routing.json ${p.id}: unknown doctor "${id}"`);
    need(categorySlugs.has(p.category), `routing.json ${p.id}: unknown category "${p.category}"`);
  }
  const b = c['booking.json'];
  need(doctorIds.has(b.defaultDoctor), `booking.json: unknown defaultDoctor "${b.defaultDoctor}"`);
  for (const id of b.generalOption.doctors) need(doctorIds.has(id), `booking.json generalOption: unknown doctor "${id}"`);
  need(imageIds.has(c['home.json'].hero.image), `home.json hero: image "${c['home.json'].hero.image}" not in images.json`);
  need(imageIds.has(c['about.json'].story.image), `about.json story: image not in images.json`);
  need(imageIds.has(c['home.json'].about.image), `home.json about: image not in images.json`);
  for (const cat of c['services.json'].categories) need(imageIds.has(cat.image), `services.json ${cat.slug}: image "${cat.image}" not in images.json`);
  for (const g of c['gallery.json'].items) {
    need(imageIds.has(g.image), `gallery.json: image "${g.image}" not in images.json`);
    need(c['gallery.json'].categories.includes(g.category), `gallery.json: unknown category "${g.category}"`);
  }
  for (const a of articleRefs) {
    need(imageIds.has(a.image), `education/${a.slug}.md: image "${a.image}" not in images.json`);
    need(doctorIds.has(a.reviewedBy), `education/${a.slug}.md: reviewedBy "${a.reviewedBy}" is not a doctor id`);
  }
  // Placeholder contact values must never look like a real, dialable number/address.
  const cl = c['clinic.json'];
  if (cl.phone.status === 'approved') need(/^\+91[6-9]\d{9}$/.test(cl.phone.e164), 'clinic.json phone: approved phone must be +91 and 10 digits');
  if (cl.whatsapp.status === 'approved') need(/^\+91[6-9]\d{9}$/.test(cl.whatsapp.e164), 'clinic.json whatsapp: approved number must be +91 and 10 digits');
  if (cl.email.status === 'approved') need(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cl.email.value), 'clinic.json email: approved email is not a valid address');
  return problems;
}
