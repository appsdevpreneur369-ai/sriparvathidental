# Booking

Every **Book** button (header, hero, symptom chips, doctor card, treatment pages, the floating mobile dock) opens the same popup. `/book` shows the same wizard inline and accepts deep links: `/book?problem=toothache`, `/book?treatment=root-canal-treatment`, `/book?doctor=dr-ramakanth`.

**Flow:** reason → day → time → your details → SMS code (OTP) → confirmation. A clinic with a single doctor never sees the "Choose your doctor" step. This is driven by content (`config.doctors.length === 1`), not clinic-specific code, so it reappears automatically once a second dentist is added.

## Auto popup

`content/booking.json → popup`: it opens once per browsing session after `delaySeconds` (12), on **desktop only** (`showOnMobile: false`; phones have the floating Book dock instead). It never opens on page load or on `excludedPaths` (`/book`, `/contact`, legal pages, `/emergency`), and never again after the visitor closes it or books. The rules live in `src/lib/booking/popupRules.ts` (unit-tested). The dialog traps focus, closes with Esc/✕/backdrop, and becomes a full-height sheet on phones.

## Modes and automatic fallback

`booking.json → mode` is the preferred mode. On opening, the site checks health and falls back in this order. It **never shows a success the API didn't return**.

| Mode | What happens | Needs |
| --- | --- | --- |
| `clinicflow` | Live slots from ClinicFlow247, SMS code, a real appointment via `POST /appointments/guest-book`, and the status the API returned. | API URL + clinic slug, clinic ACTIVE, the doctor matched, this site's origin in the API's CORS list |
| `enquiry` | Sends a real lead (`POST /clinics/public/{slug}/leads`), worded as "Request sent … not a confirmed appointment yet". | API reachable |
| `whatsapp` | Opens a pre-filled `wa.me` message. | An **approved** WhatsApp number in `clinic.json` (approved 20 Oct 2026) |
| *(unavailable)* | "Online booking is not available right now … Nothing has been sent", plus a Call button. Only reached if WhatsApp is set back to a placeholder. | — |

**SPDC today:** the WhatsApp number **+91 78939 36489** was approved on 20 Oct 2026, so the full chain applies: `clinicflow` → `enquiry` → `whatsapp`. If the API itself is down, the visitor gets a pre-filled WhatsApp message to the clinic ("send it on WhatsApp … confirmed only when the clinic replies"), never a fake booking. The e2e test checks this. With a placeholder WhatsApp number, the same case shows "not available" plus Call (unit-tested).

Build-time settings (local: `.env.local`; staging: Docker build args):

```
NEXT_PUBLIC_CLINICFLOW_API_URL=<api>/api/v1
NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=sri-parvathi-dental-clinic
NEXT_PUBLIC_BOOKING_OTP_HINT=123456          # local/staging only, while SMS is in dry-run
NEXT_PUBLIC_PORTAL_BASE_URL=<portal origin>   # sign-in / register links
```

## Architecture

- `src/lib/booking/services.ts` holds `BookingService` with the `ClinicFlow…`, `Enquiry…` and `WhatsAppBookingService` implementations, plus `resolveBookingService` (health check + fallback). There's no mock in `src/`.
- `src/lib/booking/api.ts` has the zod response schemas and the error mapping (rate limit, slot taken, bad OTP, email already registered, generic conflict).
- `src/app/api/clinicflow/[...path]` is a same-origin, allow-listed, read-only GET proxy (clinic, branches, doctors, slots). POSTs (OTP, guest-book, leads) go **straight from the visitor's browser**, because ClinicFlow rate-limits guest booking per IP.
- The chosen slot is re-checked uncached just before booking. If it was taken meanwhile, the visitor goes back to the time step with a fresh list.
- The benefits listed around the form come from `src/lib/plan.ts` for the clinic's plan (Enterprise). Nothing beyond the plan is promised.

## Tests

- `npm test` covers the fallback order including the unconfirmed-WhatsApp rule, the health check with a stubbed `fetch`, enquiry never faking success, error mapping, popup rules (desktop-only, 12 s, excluded paths), validation, and the routing map.
- `node scripts/qa/e2e-booking.mjs http://localhost:3300 qa/e2e` runs against the **local** stack only (see `docs/LOCAL_STACK.md`). It covers the auto-popup leading to a live booking with OTP, a repeat email giving the "already has a patient account" message, no second auto-open, no popup on phones, doctors API down falling back to enquiry, the whole API down giving the WhatsApp hand-off, and the deep link skipping the doctor step.

## Core behaviours worth knowing (ClinicFlow, not this repo)

- New clinics start **PENDING**; a super admin must set them ACTIVE (the importer doesn't).
- Guest booking first matches an existing patient **by phone**. A *new* phone with an email that already has a login is refused (`AUTH_EMAIL_ALREADY_EXISTS`), and the site then tells the visitor to sign in.
- Core requires a surname: single-name doctors are stored as "<Name> MDS", but the site shows its own display name.
- Treatment plans, estimates and walk-in tokens need the per-clinic **dental suite** switch (`PATCH /clinics/{id}/features {"overrides":{"dental_suite":true}}`, super admin).
