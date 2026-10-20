// zod schemas for everything in /content. A bad edit fails the build with the file and field named.
import { z } from 'zod';

export const Status = z.enum(['approved', 'placeholder']);
export type Status = z.infer<typeof Status>;

import { DAYS } from '../days';
export { DAYS } from '../days';
export const Day = z.enum(DAYS);
export type Day = z.infer<typeof Day>;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:mm (24h)');
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'colour must be #RRGGBB');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lowercase-with-dashes');
const sitePath = z.string().regex(/^(\/[^\s]*|@portal:[a-zA-Z]+|@call|@whatsapp|https:\/\/\S+)$/, 'href must be /path, @portal:<key>, @call, @whatsapp or https://');
const Note = z.string().optional();

const Text = z.object({ value: z.string().min(1), status: Status });
const Contact = z.object({ status: Status, display: z.string().min(1), e164: z.string().min(1), _note: Note });
const Session = z.object({ opens: hhmm, closes: hhmm }).refine((s) => s.opens < s.closes, 'opens must be before closes');

export const ClinicSchema = z.object({
  _note: Note,
  name: Text,
  shortName: z.string().min(1),
  slug,
  tagline: Text,
  description: Text,
  address: z.object({
    status: Status,
    _note: Note,
    doorNumber: z.string(),
    street: z.string().min(1),
    landmark: z.string(),
    locality: z.string().min(1),
    district: z.string(),
    region: z.string().min(1),
    postalCode: z.string().regex(/^(\d{6})?$/, 'PIN must be 6 digits or empty'),
    country: z.string().length(2),
    countryName: z.string(),
  }),
  phone: Contact,
  whatsapp: Contact,
  email: z
    .object({ status: Status, value: z.string().min(1) })
    .refine((e) => e.status !== 'approved' || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e.value), { message: 'an approved email must be a real address', path: ['value'] }),
  timezone: z.string().min(1),
  hours: z.object({
    _note: Note,
    status: Status,
    sessionsStatus: Status,
    daysStatus: Status,
    days: z
      .array(z.object({ day: Day, sessions: z.array(Session) }))
      .length(7)
      .refine((d) => new Set(d.map((x) => x.day)).size === 7, 'each weekday exactly once'),
  }),
  maps: z.object({
    status: Status,
    _note: Note,
    query: z.string().min(1),
    shareUrl: z.union([z.literal(''), z.string().url()]),
    embedUrl: z.union([z.literal(''), z.string().url()]),
    geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  }),
  areaServed: z.object({ status: Status, places: z.array(z.string().min(1)) }),
  foundingNote: Text,
  /** Public Google rating, hand-copied with a date. Displayed only; never emitted as aggregateRating JSON-LD. */
  google: z
    .object({
      status: Status,
      _note: Note,
      rating: z.number().min(1).max(5),
      reviewCount: z.number().int().nonnegative(),
      checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      url: z.string().url(),
      reviewTopics: z.array(z.string()),
    })
    .optional(),
});

export const BrandSchema = z.object({
  status: Status,
  _note: Note,
  colors: z.object({
    primary: hex, primaryHover: hex, primaryDeep: hex, navy: hex, navySoft: hex, tint: hex, mint: hex, mintSoft: hex,
    cta: hex, ctaHover: hex, ctaInk: hex, background: hex, surface: hex, surfaceAlt: hex, text: hex, textSecondary: hex,
    border: hex, onDark: hex, onDarkMuted: hex, mintOnDark: hex, success: hex, warning: hex, warningText: hex, warningSoft: hex,
    whatsapp: hex,
  }),
  fonts: z.object({ heading: z.string(), body: z.string() }),
  radius: z.string(),
  wordmark: z.object({ primary: z.string(), secondary: z.string() }),
});

export const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const;
export const PlanSchema = z.object({ _note: Note, plan: z.enum(PLANS) });

export const PortalSchema = z.object({
  _note: Note,
  status: Status,
  portalBaseUrl: z.string().url(),
  clinicSlug: slug,
  enterprise: z.object({ _note: Note, subdomain: z.union([z.literal(''), slug]) }),
  paths: z.object({
    login: z.string(), register: z.string(), forgotPassword: z.string(),
    clinicPage: z.string(), bookingPage: z.string(), staffLogin: z.string(),
  }),
});

export const SocialSchema = z.object({
  _note: Note,
  status: Status,
  links: z.array(
    z.object({
      platform: z.enum(['instagram', 'youtube', 'x', 'linkedin', 'facebook']),
      label: z.string(),
      url: z.union([z.literal(''), z.string().url().startsWith('https://')]),
    }),
  ),
});

const Consultation = z.object({ days: z.array(Day).min(1), opens: hhmm, closes: hhmm });

export const DoctorSchema = z.object({
  id: slug,
  status: Status,
  slug,
  previousSlugs: z.array(slug),
  firstName: z.string().min(1),
  lastName: z.string(),
  displayName: z.string().min(1),
  initials: z.string().min(1).max(3),
  qualification: z.string().min(1),
  specialty: z.string().min(1),
  schemaSpecialty: z.string().min(1),
  role: z.string(),
  isHead: z.boolean(),
  photo: z.string().nullable(),
  /** A second photo of the doctor (own photos only), shown on the profile page. */
  photoSecondary: z.string().nullable(),
  /** "" until confirmed (site shows "being confirmed"; the tenant file sends PENDING-VERIFICATION-<NAME>). */
  registrationNumber: z.string().regex(/^(?!.*PENDING)[A-Za-z0-9/ .-]*$/i, 'leave empty until confirmed, or the real Dental Council number'),
  clinicflowDoctorId: z.string().nullable(),
  summary: z.string().min(1),
  bio: z.array(z.string().min(1)).min(1),
  focus: z.array(z.string()),
  consultation: z.array(Consultation).min(1),
  consultationStatus: Status,
  /** Only from the account owner/clinic; null = not shown. */
  experienceYears: z.number().int().positive().nullable(),
  experienceStatus: Status,
});
export const DoctorsFileSchema = z.object({
  _note: Note,
  consultSlotMinutes: z.number().int().min(5).max(120),
  doctors: z.array(DoctorSchema).min(1),
});

const Faq = z.object({ q: z.string().min(1), a: z.string().min(1), home: z.boolean().optional() });

export const CategorySchema = z.object({
  slug,
  status: Status,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  icon: z.string(),
  size: z.enum(['lg', 'md', 'sm']),
  image: z.string().min(1),
  doctors: z.array(slug).min(1),
  confirmSpecialist: z.boolean(),
  short: z.string().min(1),
  intro: z.array(z.string()).min(1),
  steps: z.array(z.object({ title: z.string(), text: z.string() })),
  subTreatments: z
    .array(z.object({ slug, title: z.string(), summary: z.string(), visits: z.string(), doctors: z.array(slug).optional() }))
    .min(1),
  faqs: z.array(Faq),
  seo: z.object({ title: z.string().min(1).max(60), description: z.string().min(50).max(170) }),
});
export const ServicesSchema = z.object({ _note: Note, priceNote: z.string(), categories: z.array(CategorySchema).min(1) });

export const RoutingSchema = z.object({
  _note: Note,
  status: Status,
  problems: z.array(z.object({ id: slug, label: z.string(), icon: z.string(), doctors: z.array(slug).min(1), category: slug })),
});

const PopupSchema = z.object({
  _note: Note,
  enabled: z.boolean(),
  delaySeconds: z.number().min(1),
  oncePerSession: z.boolean(),
  showOnMobile: z.boolean(),
  excludedPaths: z.array(z.string().startsWith('/')),
});

export const BookingSchema = z.object({
  status: Status,
  _note: Note,
  mode: z.enum(['clinicflow', 'enquiry', 'whatsapp']),
  clinicflow: z.object({
    _note: Note,
    apiBaseUrl: z.union([z.literal(''), z.string().url()]),
    clinicSlug: z.union([z.literal(''), slug]),
    clinicId: z.string(),
  }),
  advanceDays: z.number().int().min(1).max(120),
  otpResendSeconds: z.number().int().min(10),
  allowDirectSpecialistBooking: z.boolean(),
  defaultDoctor: slug,
  generalOption: z.object({ label: z.string(), doctors: z.array(slug).min(1) }),
  popup: PopupSchema,
  consent: z.string().min(1),
  whatsappMessage: z.string(),
  enquiryMessage: z.string(),
  generalWhatsappMessage: z.string(),
  note: z.string(),
});

const Chip = z.object({ icon: z.string(), text: z.string(), sub: z.string().optional(), kind: z.enum(['hours', 'static']) });
const Head = z.object({ eyebrow: z.string(), title: z.string(), lead: z.string().optional() });
const IconItem = z.object({ icon: z.string(), title: z.string(), text: z.string() });

export const HomeSchema = z.object({
  status: Status,
  hero: z.object({
    badge: z.string(), titleLine1: z.string(), titleLine2: z.string(), lead: z.string(), image: z.string(), primaryCta: z.string(),
    secondaryCta: z.object({ label: z.string(), href: sitePath }), checks: z.array(z.string()), chips: z.array(Chip),
  }),
  stats: z.object({
    _note: Note,
    status: Status,
    items: z.array(z.object({ value: z.string(), label: z.string(), sub: z.string(), icon: z.string(), source: z.string().min(3) })),
  }),
  about: z.object({
    eyebrow: z.string(), title: z.string(), paragraphs: z.array(z.string()).min(1), points: z.array(z.string()), image: z.string(),
    badgeValue: z.string(), badgeLabel: z.string(), cta: z.object({ label: z.string(), href: sitePath }),
  }),
  treatments: Head,
  symptoms: Head,
  doctors: Head,
  why: Head.extend({ points: z.array(IconItem) }),
  steps: Head.extend({ items: z.array(IconItem) }),
  booking: z.object({ stepsTitle: z.string(), steps: z.array(z.object({ title: z.string(), text: z.string() })) }),
  gallery: Head,
  education: Head,
  faq: Head,
  visit: Head,
  cta: z.object({ title: z.string(), lead: z.string(), button: z.string() }),
  beforeAfter: z.object({ _note: Note, status: Status, items: z.array(z.object({ before: z.string(), after: z.string(), caption: z.string(), consent: z.literal(true) })) }),
});

export const AboutSchema = z.object({
  status: Status,
  story: z.object({ title: z.string(), paragraphs: z.array(z.string()).min(1), image: z.string() }),
  clinicHead: z.object({ eyebrow: z.string(), title: z.string(), lead: z.string(), bookLabel: z.string(), profileLabel: z.string() }),
  values: z.object({ title: z.string(), items: z.array(IconItem) }),
  team: z.object({ title: z.string(), lead: z.string() }),
  starterFeatures: z.object({ title: z.string(), lead: z.string(), _note: Note }),
});

export const FaqsSchema = z.object({ _note: Note, status: Status, items: z.array(Faq).min(1) });

export const EmergencySchema = z.object({
  status: Status,
  title: z.string(),
  lead: z.string(),
  hospitalWarning: z.string(),
  situations: z.array(z.object({ title: z.string(), steps: z.array(z.string()).min(1) })),
});

export const GallerySchema = z.object({
  _note: Note,
  status: Status,
  intro: z.string(),
  categories: z.array(z.string()),
  items: z.array(z.object({ image: z.string(), caption: z.string(), category: z.string() })),
});

const ImageRef = z.object({
  src: z.string().startsWith('/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  status: Status,
  credit: z.string().optional(),
  /** CSS object-position focal point for cropped displays, e.g. "50% 18%" (keeps a face or signage in frame). */
  objectPosition: z.string().regex(/^\d{1,3}% \d{1,3}%$/).optional(),
});
export const ImagesSchema = z.object({
  _note: Note,
  logo: z.object({
    mark: ImageRef,
    /** Logo with the clinic name set in it. Optional: the header uses the mark + a text wordmark. */
    full: ImageRef.optional(),
    source: z.object({ src: z.string(), _note: Note }),
    sourceTitle: z.object({ src: z.string(), _note: Note }).optional(),
  }),
  images: z.record(z.string(), ImageRef),
});
export type ImageRef = z.infer<typeof ImageRef>;

const NavLink = z.object({ label: z.string(), href: sitePath });
export const NavigationSchema = z.object({
  header: z.array(NavLink),
  footer: z.array(z.object({ title: z.string(), links: z.array(NavLink) })),
});

const PageMeta = z.object({
  title: z.string().min(1),
  description: z.string().min(50).max(170),
  h1: z.string().optional(),
  intro: z.string().optional(),
  absoluteTitle: z.boolean().optional(),
});
export const PagesSchema = z.object({
  _note: Note,
  home: PageMeta, about: PageMeta, doctors: PageMeta, treatments: PageMeta, gallery: PageMeta, education: PageMeta,
  faqs: PageMeta, book: PageMeta, contact: PageMeta, emergency: PageMeta, privacy: PageMeta, terms: PageMeta,
  disclaimer: PageMeta, cookies: PageMeta,
  notFound: z.object({ title: z.string(), h1: z.string(), intro: z.string() }),
});

export const ArticleFrontmatter = z.object({
  title: z.string().min(1),
  slug,
  description: z.string().min(50).max(170),
  category: z.string(),
  image: z.string(),
  datePublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewedBy: slug,
  reviewStatus: z.enum(['pending', 'reviewed']),
  status: Status,
  readingMinutes: z.number().int().positive(),
  featured: z.boolean(),
});
export const LegalFrontmatter = z.object({
  title: z.string(),
  slug,
  status: Status,
  draft: z.boolean(),
  lastUpdated: z.string(),
});

export type Clinic = z.infer<typeof ClinicSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Portal = z.infer<typeof PortalSchema>;
export type PlanName = (typeof PLANS)[number];
