# SPDC — items to collect from Sri Parvathi Dental Clinic

Last updated 20 Oct 2026. Everything below is on the site as a **placeholder** (shown with a "Draft" badge on local and staging builds). Where each value goes: `docs/EDITING.md`.

| # | Item | Why it matters | Current placeholder | Where it goes |
| --- | --- | --- | --- | --- |
| 1 | **Clinic email** (kept as a placeholder on purpose) | Contact page, footer, JSON-LD, ClinicFlow clinic record | Hidden; `null` in the tenant file | `clinic.json → email`. Steps: EDITING.md → "Swapping in the clinic email or registration number" |
| 2 | **Update the Google Business listing phone** from 089546 56789 to **+91 78939 36489** (now used for calls and WhatsApp) | Google and the website must show the same number (local SEO, fewer wrong calls) | Website already uses the new number | Google Business Profile (clinic owner) |
| 3 | **Dr. Ramakanth's surname, MDS specialty branch, years of experience** | Doctor page; core requires a surname (stored as "Ramakanth MDS" for now) | "Dr. Ramakanth, MDS"; no experience shown | `content/doctors.json` |
| 4 | **Dr. Ramakanth's State Dental Council registration number** (kept as a placeholder on purpose) | **Required before any real e-prescription** (printed on the legal Rx PDF) | `PENDING-VERIFICATION-RAMAKANTH` | `doctors.json → registrationNumber`. Steps: EDITING.md → same section |
| 5 | **Other dentists / visiting specialists** — especially for implants and braces/aligners | Routing, treatment pages, booking ("choose your doctor" appears automatically with 2+) | Everything goes to Dr. Ramakanth for a first consultation, with a note | `doctors.json`, `services.json`, `routing.json` |
| 6 | **Doctor photo** | Trust | Initials avatar (never a stock photo) | `images.json` + `doctors.json → photo` |
| 7 | **Clinic photos** (signboard, reception, treatment room, equipment) | Gallery, About, Contact, Google | Representative stock photos, captioned as such | `public/images/photos/`, `images.json`, `gallery.json` |
| 8 | **Website domain** | Canonical URLs, sitemap, email | none | `NEXT_PUBLIC_SITE_URL` |
| 9 | **Login emails** for the owner, front desk and each doctor | ClinicFlow accounts (invite by email) | Placeholder aliases of our test inbox | `scripts/build-tenant.mjs` → `npm run tenant` |
| 10 | **Copy review**: tagline, About story, home hero, FAQs, emergency page, treatment pages | Accuracy and tone | Drafts we wrote (no invented facts) | `clinic.json`, `about.json`, `home.json`, `faqs.json`, `emergency.json`, `services.json` |
| 11 | **Areas served** (Tadepalli, Undavalli, Mangalagiri, Vijayawada, Guntur?) | Local SEO (`areaServed`) | Draft list | `clinic.json → areaServed` |
| 12 | **Patient education review**: Dr. Ramakanth checks the 4 articles | Medical accuracy | `reviewStatus: pending` | `content/education/*.md` |
| 13 | **Legal review** (Privacy under the DPDP Act 2023, Terms, Disclaimer, Cookies) and a named **grievance officer** | Legal compliance | Drafts | `content/legal/*.md` |
| 14 | **Consent wording** on the booking form | DPDP consent | Draft sentence | `booking.json → consent` |
| 15 | **Social media profiles** | Footer, `sameAs` | Greyed-out icons | `content/social.json` |
| 16 | Before/after photos (optional; real and consented only) | Home page | Section hidden | `home.json → beforeAfter` |

**Already confirmed (20 Oct 2026):** clinic name; address (First Floor, Perreddy Complex, Pathur Road Cross, Tadepalle 522501) and map pin; **+91 78939 36489 for both calls and WhatsApp**; **clinic logo + favicon** (our design, `images/spdc-logo.svg`); **Enterprise subdomain `sriparvathi.clinicflow247.com`** (tenant app, LB host rule and DNS still to be created on deploy, after APPROVED); hours from Google (Mon–Sat 9:30 AM–9:30 PM, Sun 10 AM–2 PM); Google rating (dated); plan **ENTERPRISE (white label)**; Dr. Ramakanth, MDS leads the clinic.

## Blockers outside the clinic (ClinicFlow team)

- **Core security fix:** `GET /appointments/{id}/history` is readable by other patients and by other clinics' doctors (`docs/E2E_2026-10-20.md` §3). This must be fixed before go-live.
- Core shows the clinic favicon only after sign-in (`DashboardShell.tsx`). Public portal pages keep ClinicFlow's favicon.
- Core `HEAD` fails `next build` lint, so the local portal is built with `--no-lint`.
