# CLAUDE.md — Sri Parvathi Dental Clinic public website (SPDC)

Public website for **Sri Parvathi Dental Clinic**, First Floor, Perreddy Complex, Pathur Road Cross, Tadepalle (project code SPDC), led by Dr. Ramakanth, MDS. It is a ClinicFlow247 **ENTERPRISE (white-label)** clinic from day one (20 Oct 2026).

**Delivery model (owner's decision, 20 Oct 2026): website + core tenant.** This repo is the public site plus the generated tenant file `tenant/sri-parvathi.json`. Every role and workflow (SUPER_ADMIN, CLINIC_ADMIN, DOCTOR, PATIENT) comes from ClinicFlow core, branded via the Enterprise theme tokens, logo and appTitle. **Never fork core** for SPDC: `D:\ClinicFlow\CLAUDE.md` forbids per-tenant codebases.

Status: pushed to GitHub (https://github.com/appsdevpreneur369-ai/sriparvathidental, `main`); **on staging since 2026-10-20** (owner APPROVED). Not in production. Open items: `PENDING_ITEMS.md`. Test report: `docs/E2E_2026-10-20.md`.

## Hard rules

- **No deploy until the owner replies "APPROVED".** Pushing to the GitHub repo happens when the owner asks. Staging and production deploys need APPROVED, and also running the tenant file against staging or production or changing the ClinicFlow staging API.
- **Read-only:** `D:\ClinicFlow`, `D:\DR-SINDHU`, `D:\SMSDC`. Local e2e uses a `git archive` copy of core in `.local-stack/` plus a throwaway Postgres (`docs/LOCAL_STACK.md`). Core bugs are reported, not patched here.
- **Plan gate:** `content/plan.json` = `enterprise`. `src/lib/plan.ts` stops the site promising anything the plan doesn't include.
- **Everything config-driven** from `/content` and zod-validated. Every record has `status: approved | placeholder`. Components never hard-code copy, colours, images, phone numbers or hours.
- **Placeholders never become dead links.** A placeholder phone, WhatsApp or email hides its buttons and is left out of JSON-LD. Today **+91 78939 36489** is approved for both calls and WhatsApp (owner, 20 Oct 2026). The **email** and Dr. Ramakanth's **registration number** stay placeholders on purpose until the clinic sends them; swap steps are in `docs/EDITING.md`, and the schema rejects a fake value.
- **Never invent** a phone, email, registration number, experience, reviews, ratings, awards, patient counts or prices. Doctors get an initials avatar until a real photo arrives (never stock). Stock photos are captioned "representative" and show **Indian faces only**, across age groups (owner, 20 Oct 2026). The clinic's own photos (`clinic-*`, from `images/`) are used for the clinic itself; never a stock room presented as the clinic. Medical wording stays cautious.
- **Booking never fakes success.** Order: `clinicflow` → `enquiry` → `whatsapp` (only once approved) → "not available" plus Call.
- **Copy stays original** and doesn't reuse DR-SINDHU or SMSDC sentences (same town, duplicate-content risk). Brand and logo are SPDC's own.

## Stack and brand

Next.js 14.2 App Router, TypeScript strict, Tailwind, next/font (**Fraunces** headings + **Plus Jakarta Sans** body), zod, vitest, lucide-react. Logo (approved 20 Oct 2026): `images/spdc-logo.svg`, a white tooth with a lotus on the teal tile and a gold bindu. `npm run brand` derives the header mark, favicon, app icons and OG image from it. Enterprise subdomain: `sriparvathi.clinicflow247.com` (`content/portal.json`). It follows the DR-SINDHU and SMSDC site patterns.

Palette (`content/brand.json`): deep teal primary `#0E7C86`, mint `#9FE2C8`, navy text and footer `#0B2545`, gold CTA `#E9B44C` (background only, navy text on it), amber warning `#A34A08` (no red). `npm run contrast` passes every text pair at AA. The same colours feed the tenant `themeTokens`, so the portal matches the site.

## Commands

| Command | What |
| --- | --- |
| `npm run dev` / `npm run build && npm start` | Dev / production |
| `npm run check` | lint + typecheck + tests + contrast + build |
| `npm run brand` | Logo sizes, icons, OG image from `images/` + `brand.json` |
| `npm run images` | WebP variants (runs before every build) |
| `npm run tenant` | Regenerate `tenant/sri-parvathi.json` from `/content` |
| `bash scripts/local-stack/{setup,start,stop}.sh`, `node scripts/local-stack/seed.mjs` | Local core stack (`docs/LOCAL_STACK.md`) |
| `node scripts/qa/e2e-booking.mjs http://localhost:3300 qa/e2e` | Booking e2e (local API only) |
| `node scripts/qa/rbac-api.mjs` | Role and tenant-isolation matrix (local API only) |
| `node scripts/qa/screens.mjs <base> qa/screens` | 360/768/1280 screenshots, overflow and tap-target report |
| `node scripts/qa/lighthouse.mjs <base> docs/seo-reports/<date>` | Lighthouse mobile + desktop |

In Git Bash, prefix scripts that take `/paths` with `MSYS_NO_PATHCONV=1`.

## Checklist

1. [x] Next.js + Tailwind + vitest + eslint scaffold; `/content` with zod and cross-reference checks
2. [x] Brand, palette and placeholder logo mark; all pages (1 doctor, 10 treatment categories, 4 articles, 4 legal drafts, 404)
3. [x] Booking popup + wizard, live ClinicFlow booking with fallbacks; portal links + redirects
4. [x] SEO: metadata, canonical, OG, sitemap, robots, JSON-LD, env noindex
5. [x] `tenant/sri-parvathi.json` (Enterprise, theme tokens, invite-by-email logins)
6. [x] `npm run check` green: 56 unit tests, AA contrast, 38 pages built (20 Oct 2026)
7. [x] Local core stack + seed for every role; booking e2e 8/8; RBAC 193 pass / 2 observe (core IDOR, reported)
8. [x] Docs: README, EDITING, BOOKING, LOCAL_STACK, E2E report, PENDING_ITEMS
9. [x] Visual QA 360/768/1280 (0 overflow), keyboard 10/10, Lighthouse (SEO 100, A11y 100, mobile Perf 91–97), SEO audit 29 pages / 0 JSON-LD errors (`docs/seo-reports/2026-10-20`, `docs/screenshots`)
10. [x] First git commit (local only, `fdebc54`)
11. [x] Owner's answers (20 Oct 2026): WhatsApp approved, logo + favicon designed, subdomain confirmed; email and registration number kept as placeholders with documented swap steps
12. [x] GitHub push to `appsdevpreneur369-ai/sriparvathidental` (20 Oct 2026, owner's request)
13. [ ] **"APPROVED"**, then staging onboarding (tenant file, logo/favicon upload, subdomain tenant app + LB rule + DNS) and deploy

## Deployments

Manual, same as the DR-SINDHU and SMSDC sites: build the image locally, push to Artifact Registry, `gcloud run deploy`. Never touch other services, `clinicflow-lb`, certs or DNS without the owner's yes.

| Item | Value |
| --- | --- |
| GCP | project `sincere-stock-499113-f1`, region `asia-south1` |
| Image | `asia-south1-docker.pkg.dev/sincere-stock-499113-f1/clinicflow/spdc-frontend:<git short SHA>` |
| Staging service | `spdc-frontend-staging`: 256Mi, 1 CPU, min-instances 0, unauthenticated, port 3000 |
| Staging URL | https://spdc-frontend-staging-1071497363324.asia-south1.run.app |
| Staging build args | `NEXT_PUBLIC_SITE_ENV=staging`, `NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true`, `NEXT_PUBLIC_NOINDEX=true`, `NEXT_PUBLIC_SITE_URL=<staging URL>`, `NEXT_PUBLIC_CLINICFLOW_API_URL=https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1`, `NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=sri-parvathi-dental-clinic`, `NEXT_PUBLIC_BOOKING_OTP_HINT=123456`, `NEXT_PUBLIC_PORTAL_BASE_URL=https://clinicflow-frontend-staging-1071497363324.asia-south1.run.app` |
| Staging clinic | `python scripts/staging/setup-staging.py --admin-email <super admin>` (run by a super admin; password prompted, never stored). Imports without `customDomain` (production-only host). |
| Staging API CORS | This origin must be in `APP_CORS_ALLOWEDORIGINS` of `clinicflow-api-staging` for live booking from the browser. |

History (staging):

| Date | Commit / image tag | Revision | Notes |
| --- | --- | --- | --- |
| 2026-10-20 | `bf57d53` | `spdc-frontend-staging-00001-k6f` | First deploy after the owner's APPROVED. 15 pages 200, `/login` + `/register` 307 to the staging portal, 404 page, noindex header + robots Disallow, no ERROR logs. |

Redeploy staging (all NEXT_PUBLIC_* values are baked in at build time):

```bash
SHA=$(git rev-parse --short HEAD)
IMG=asia-south1-docker.pkg.dev/sincere-stock-499113-f1/clinicflow/spdc-frontend:$SHA
docker build --build-arg NEXT_PUBLIC_SITE_ENV=staging --build-arg NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true --build-arg NEXT_PUBLIC_NOINDEX=true --build-arg NEXT_PUBLIC_SITE_URL=https://spdc-frontend-staging-1071497363324.asia-south1.run.app --build-arg NEXT_PUBLIC_CLINICFLOW_API_URL=https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1 --build-arg NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=sri-parvathi-dental-clinic --build-arg NEXT_PUBLIC_BOOKING_OTP_HINT=123456 --build-arg NEXT_PUBLIC_PORTAL_BASE_URL=https://clinicflow-frontend-staging-1071497363324.asia-south1.run.app -t $IMG .
docker push $IMG
gcloud run deploy spdc-frontend-staging --project sincere-stock-499113-f1 --region asia-south1 --image $IMG
```
