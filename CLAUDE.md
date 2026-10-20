# CLAUDE.md — Sri Parvathi Dental Clinic public website (SPDC)

Public website for **Sri Parvathi Dental Clinic**, First Floor, Perreddy Complex, Pathur Road Cross, Tadepalle (project code SPDC), led by Dr. Ramakanth, MDS. It is a ClinicFlow247 **ENTERPRISE (white-label)** clinic from day one (20 Oct 2026).

**Delivery model (owner's decision, 20 Oct 2026): website + core tenant.** This repo is the public site plus the generated tenant file `tenant/sri-parvathi.json`. Every role and workflow (SUPER_ADMIN, CLINIC_ADMIN, DOCTOR, PATIENT) comes from ClinicFlow core, branded via the Enterprise theme tokens, logo and appTitle. **Never fork core** for SPDC: `D:\ClinicFlow\CLAUDE.md` forbids per-tenant codebases.

Status: **built and tested locally, not pushed, not deployed.** Open items: `PENDING_ITEMS.md`. Test report: `docs/E2E_2026-10-20.md`.

## Hard rules

- **No push and no deploy until the owner replies "APPROVED".** That covers GitHub, staging and production alike, and also running the tenant file against staging or production or changing the ClinicFlow staging API.
- **Read-only:** `D:\ClinicFlow`, `D:\DR-SINDHU`, `D:\SMSDC`. Local e2e uses a `git archive` copy of core in `.local-stack/` plus a throwaway Postgres (`docs/LOCAL_STACK.md`). Core bugs are reported, not patched here.
- **Plan gate:** `content/plan.json` = `enterprise`. `src/lib/plan.ts` stops the site promising anything the plan doesn't include.
- **Everything config-driven** from `/content` and zod-validated. Every record has `status: approved | placeholder`. Components never hard-code copy, colours, images, phone numbers or hours.
- **Placeholders never become dead links.** WhatsApp and email are unconfirmed, so their buttons are hidden, they're left out of JSON-LD, and WhatsApp booking is off. The phone (from Google) is approved.
- **Never invent** a phone, email, registration number, experience, reviews, ratings, awards, patient counts or prices. Doctors get an initials avatar until a real photo arrives (never stock). Stock photos are captioned "representative". Medical wording stays cautious.
- **Booking never fakes success.** Order: `clinicflow` → `enquiry` → `whatsapp` (only once approved) → "not available" plus Call.
- **Copy stays original** and doesn't reuse DR-SINDHU or SMSDC sentences (same town, duplicate-content risk). Brand and logo are SPDC's own.

## Stack and brand

Next.js 14.2 App Router, TypeScript strict, Tailwind, next/font (**Fraunces** headings + **Plus Jakarta Sans** body), zod, vitest, lucide-react. It follows the DR-SINDHU and SMSDC site patterns.

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
10. [ ] First git commit (local only)
11. [ ] Owner review, then **"APPROVED"**, then GitHub push, staging onboarding and deploy
