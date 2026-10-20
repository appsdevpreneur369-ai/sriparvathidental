# SPDC — items to collect from Sri Parvathi Dental Clinic

Last updated 20 Oct 2026. Everything below is on the site as a **placeholder** (shown with a "Draft" badge on local and staging builds). Where each value goes: `docs/EDITING.md`.

| # | Item | Why it matters | Current placeholder | Where it goes |
| --- | --- | --- | --- | --- |
| 1 | **WhatsApp number** — does +91 89546 56789 take WhatsApp, or is there another number? | WhatsApp buttons and the WhatsApp booking fallback are hidden until confirmed | Hidden | `content/clinic.json → whatsapp` |
| 2 | **Clinic email** | Contact page, footer, JSON-LD, ClinicFlow clinic record | Hidden; `null` in the tenant file | `clinic.json → email` |
| 3 | **Confirm the phone** +91 89546 56789 is the one patients should call (taken from Google) | Call buttons everywhere | Shown (approved from Google) | `clinic.json → phone` |
| 4 | **Dr. Ramakanth's surname, MDS specialty branch, years of experience** | Doctor page; core requires a surname (stored as "Ramakanth MDS" for now) | "Dr. Ramakanth, MDS"; no experience shown | `content/doctors.json` |
| 5 | **Dr. Ramakanth's State Dental Council registration number** | **Required before any real e-prescription** (printed on the legal Rx PDF) | `PENDING-VERIFICATION-RAMAKANTH` | `doctors.json`, then `npm run tenant` |
| 6 | **Other dentists / visiting specialists** — especially for implants and braces/aligners | Routing, treatment pages, booking ("choose your doctor" appears automatically with 2+) | Everything goes to Dr. Ramakanth for a first consultation, with a note | `doctors.json`, `services.json`, `routing.json` |
| 7 | **Doctor photo** | Trust | Initials avatar (never a stock photo) | `images.json` + `doctors.json → photo` |
| 8 | **Logo** (master file) and favicon | Site header, icons, OG image, **white-label portal branding** | Placeholder mark we designed | `images/` → `images.json` → `npm run brand`; upload to ClinicFlow (clinic admin) |
| 9 | **Clinic photos** (signboard, reception, treatment room, equipment) | Gallery, About, Contact, Google | Representative stock photos, captioned as such | `public/images/photos/`, `images.json`, `gallery.json` |
| 10 | **Enterprise subdomain** (proposed `sriparvathi.clinicflow247.com`) | Branded patient/staff portal URL | Shared portal path for the slug | `content/portal.json → enterprise.subdomain` (+ tenant app and LB host rule in ClinicFlow) |
| 11 | **Website domain** | Canonical URLs, sitemap, email | none | `NEXT_PUBLIC_SITE_URL` |
| 12 | **Login emails** for the owner, front desk and each doctor | ClinicFlow accounts (invite by email) | Placeholder aliases of our test inbox | `scripts/build-tenant.mjs` → `npm run tenant` |
| 13 | **Copy review**: tagline, About story, home hero, FAQs, emergency page, treatment pages | Accuracy and tone | Drafts we wrote (no invented facts) | `clinic.json`, `about.json`, `home.json`, `faqs.json`, `emergency.json`, `services.json` |
| 14 | **Areas served** (Tadepalli, Undavalli, Mangalagiri, Vijayawada, Guntur?) | Local SEO (`areaServed`) | Draft list | `clinic.json → areaServed` |
| 15 | **Patient education review**: Dr. Ramakanth checks the 4 articles | Medical accuracy | `reviewStatus: pending` | `content/education/*.md` |
| 16 | **Legal review** (Privacy under the DPDP Act 2023, Terms, Disclaimer, Cookies) and a named **grievance officer** | Legal compliance | Drafts | `content/legal/*.md` |
| 17 | **Consent wording** on the booking form | DPDP consent | Draft sentence | `booking.json → consent` |
| 18 | **Social media profiles** | Footer, `sameAs` | Greyed-out icons | `content/social.json` |
| 19 | Before/after photos (optional; real and consented only) | Home page | Section hidden | `home.json → beforeAfter` |

**Already confirmed (20 Oct 2026):** clinic name; address (First Floor, Perreddy Complex, Pathur Road Cross, Tadepalle 522501) and map pin; hours from Google (Mon–Sat 9:30 AM–9:30 PM, Sun 10 AM–2 PM); phone from Google; Google rating (dated); plan **ENTERPRISE (white label)**; Dr. Ramakanth, MDS leads the clinic.

## Blockers outside the clinic (ClinicFlow team)

- **Core security fix:** `GET /appointments/{id}/history` is readable by other patients and by other clinics' doctors (`docs/E2E_2026-10-20.md` §3). This must be fixed before go-live.
- Core `HEAD` fails `next build` lint, so the local portal is built with `--no-lint`.
