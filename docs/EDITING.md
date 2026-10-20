# Editing the Sri Parvathi Dental Clinic website

Everything the site says lives in `/content`. Components never contain clinic text, colours, phone numbers, hours or image paths. A mistake in a content file (a bad time, an unknown doctor id, a broken URL) **fails the build and names the file and field**, so a broken edit can't go live.

After any edit, run `npm test && npm run build`. After a colour change, also run `npm run contrast` and `npm run brand`. After changing clinic, doctor, hours or treatment data, run `npm run tenant` to regenerate the ClinicFlow onboarding file.

## Approved vs placeholder

Every record carries `"status": "approved" | "placeholder"`. With `NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true` (local and staging), every placeholder shows a small **Draft** badge, so the clinic can see what still needs confirming. When the clinic confirms an item, set its status to `approved` and tick it off in `PENDING_ITEMS.md`.

## Which file do I edit?

| I want to change… | File | Notes |
| --- | --- | --- |
| Phone | `content/clinic.json` → `phone` | **+91 78939 36489**, the same number as WhatsApp (owner, 20 Oct 2026). `e164` must be `+91` plus a 10-digit mobile. The Google listing still shows 089546 56789 and should be updated to match. |
| WhatsApp | `clinic.json` → `whatsapp` | **+91 78939 36489**, approved 20 Oct 2026. It's the same number as the call number. It drives every WhatsApp button (top strip, mobile dock, contact), JSON-LD and the booking fallback. Setting `status: "placeholder"` hides them all again. |
| Email | `clinic.json` → `email` | **Placeholder for now.** See "Swapping in the clinic email or registration number" below. |
| Address / map pin | `clinic.json` → `address`, `maps` | `maps.geo` feeds the schema.org `GeoCoordinates`. `shareUrl` is the place's stable `?cid=` link. |
| Opening hours | `clinic.json` → `hours.days` | Each day can have several sessions. A single session prints as "9:30 AM – 9:30 PM"; split sessions print as "Morning … & Evening …". One formatter (`src/lib/hours.ts`) feeds the top strip, hero chip, footer, Contact, FAQs, doctor pages, JSON-LD and the tenant file. |
| Google rating | `clinic.json` → `google` | Copy the rating and review count by hand and update `checkedOn`. Shown with that date; **never** emitted as `aggregateRating` (Google treats self-served review markup on local businesses as spam). |
| Colours / fonts | `content/brand.json` | Then run `npm run contrast` (must pass) and `npm run brand`. Fonts must be registered in `src/lib/theme.ts` (Fraunces and Plus Jakarta Sans today). Gold (`cta`) is a background only, with navy text on it. |
| Logo | `images/spdc-logo.svg` (master), then run `npm run brand` | The clinic logo (approved 20 Oct 2026): a white tooth with a lotus on the teal tile and a gold bindu. `npm run brand` rebuilds the header mark, **favicon**, app icons and the social-share image from it, so they always match. The same `public/brand/logo-mark.png` and `src/app/icon.png` are uploaded to ClinicFlow as the white-label logo and favicon. |
| Photos | `content/images.json`, built by `scripts/fetch-photos.mjs` | **Clinic's own photos:** drop the file in `images/`, add it to `OWN` in `scripts/fetch-photos.mjs`, run `node scripts/fetch-photos.mjs`, then add an `images.json` entry with an id starting `clinic-`, `status: "approved"` and **no `credit`** (`objectPosition` sets the focal point for cropped slots). Two are in today: `clinic-treatment-rooms` and `clinic-waiting-area`. **Stock photos** (Unsplash / Pexels, sources in `photo-credits.json`) stay `placeholder` with a `credit`, and every person shown must be Indian (owner, 20 Oct 2026). Only photos without `credit` may appear in the gallery JSON-LD or on a doctor card. |
| Gallery | `content/gallery.json` | The clinic's own photos (`clinic-*`) have plain captions; every stock photo's caption says "(representative photo)" (a test enforces both). |
| Doctors | `content/doctors.json` | See "Adding or renaming a doctor" below. `photo` takes an image id, or `null` for the initials avatar. |
| Treatments | `content/services.json` | Visit counts always say "usually". **Never add prices.** `confirmSpecialist: true` shows the "first consultation with Dr. Ramakanth" note. |
| "How can we help?" chips | `content/routing.json` | Each chip lists doctor ids and a treatment category. |
| Home page | `content/home.json` | Every `stats` item must name its `source`. `beforeAfter` stays empty until real, consented photos exist. |
| About / FAQs / Emergency | `about.json`, `faqs.json`, `emergency.json` | `{{hoursSummary}}`, `{{address}}` and `{{googleRating}}` are filled in automatically. |
| Articles | `content/education/<slug>.md` | Front-matter is validated, and the file name must equal the `slug`. Set `reviewStatus: reviewed` once Dr. Ramakanth has checked the article. |
| Legal pages | `content/legal/*.md` | Shown as **Draft** until `draft: false` (after legal review). |
| Page titles & descriptions | `content/pages.json` | The " \| Sri Parvathi Dental, Tadepalli" suffix is added when it fits in 60 characters. Descriptions must be 50–170 characters. |
| Menus | `content/navigation.json` | `href` may be a site path, `@portal:login` / `@portal:register` / `@portal:staffLogin`, `@call`, `@whatsapp` or an `https://` URL. Placeholder targets are hidden. |
| Social media | `content/social.json` | An empty `url` gives a greyed-out, non-clickable icon and leaves it out of `sameAs`. |
| Booking popup, consent, messages | `content/booking.json` | See `docs/BOOKING.md`. |
| ClinicFlow portal links / subdomain | `content/portal.json` | Set `enterprise.subdomain` once agreed (proposed: `sriparvathi`). See `docs/WHITE_LABEL.md`. |

## Swapping in the clinic email or registration number

These two are deliberately kept as placeholders until the clinic sends them. Each one is a single edit, and the build refuses an obviously wrong value.

**Clinic email**

1. In `content/clinic.json`, set `"email": { "status": "approved", "value": "<real address>" }`. Until then the value is "email to be confirmed" and every email link stays hidden.
2. Run `npm run tenant`. The tenant file's `clinic.email` changes from `null` to the address.
3. Run `npm test && npm run build`. An approved value that isn't a real address fails the build.
4. If the clinic is already onboarded on ClinicFlow, also set the email there: clinic admin → **Clinic → Profile → Email** (or `PUT /clinics/{id}` with `email`).

The email then appears on Contact, in the footer and in JSON-LD.

**Dr. Ramakanth's State Dental Council registration number**

1. In `content/doctors.json`, set `"registrationNumber": "<number>"`. Leave it `""` until it's confirmed. The build rejects anything containing `PENDING`.
2. Run `npm run tenant`. The tenant file's `mciRegistrationNumber` changes from `PENDING-VERIFICATION-RAMAKANTH` to the number.
3. Run `npm test && npm run build`. The doctor page now shows "Dental Council registration no. …" in place of "being confirmed".
4. If the clinic is already onboarded on ClinicFlow, also update the doctor there: clinic admin → **Doctors** → Dr. Ramakanth → registration number (or `PUT /clinics/{id}/doctors/{doctorId}` with `mciRegistrationNumber`). **Do this before he issues any real e-prescription**, because the number is printed on the Rx PDF.

Then tick the item off in `PENDING_ITEMS.md`.

## Adding or renaming a doctor

Doctors are referenced everywhere by a permanent `id` (`ramakanth`), never by name.

- **Rename:** change `firstName`, `lastName`, `displayName` and `initials`. Give it a new `slug` and move the old one into `previousSlugs`; the old URL then redirects (308) automatically.
- **Add a dentist:** add a record with a new `id`, then list that id in the `doctors` of the relevant `services.json` categories and `routing.json` chips. With more than one doctor, the booking wizard automatically shows its "Choose your doctor" step, which is skipped while the clinic has one dentist.
- Afterwards, run `npm run tenant`, `npm test` and `npm run build`.

## Copy rules

- All wording is original and specific to SPDC. Never paste text from another clinic's website, including other ClinicFlow247 sites in Tadepalli (duplicate content hurts both in Google). `tests/content.test.ts` fails if another clinic's name appears in `/content`.
- Use cautious medical language ("usually", "may help") and promise no results.
- Never invent reviews, ratings, patient counts, awards, years of experience or prices.
- Never present a stock photo of a person as our doctor, staff or patient. `checkReferences` rejects a stock photo set as a doctor photo.
