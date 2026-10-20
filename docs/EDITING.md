# Editing the Sri Parvathi Dental Clinic website

Everything the site says lives in `/content`. Components never contain clinic text, colours, phone numbers, hours or image paths. A mistake in a content file (a bad time, an unknown doctor id, a broken URL) **fails the build and names the file and field**, so a broken edit can't go live.

After any edit, run `npm test && npm run build`. After a colour change, also run `npm run contrast` and `npm run brand`. After changing clinic, doctor, hours or treatment data, run `npm run tenant` to regenerate the ClinicFlow onboarding file.

## Approved vs placeholder

Every record carries `"status": "approved" | "placeholder"`. With `NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true` (local and staging), every placeholder shows a small **Draft** badge, so the clinic can see what still needs confirming. When the clinic confirms an item, set its status to `approved` and tick it off in `PENDING_ITEMS.md`.

## Which file do I edit?

| I want to change… | File | Notes |
| --- | --- | --- |
| Phone | `content/clinic.json` → `phone` | `e164` must be `+91` plus a 10-digit mobile. Verified from the Google listing on 20 Oct 2026. |
| WhatsApp | `clinic.json` → `whatsapp` | **Placeholder until the clinic confirms the WhatsApp number.** While it's a placeholder, every WhatsApp button is hidden and WhatsApp booking is off. Set `status: "approved"` and the buttons appear everywhere (top strip, mobile dock, contact, booking fallback). |
| Email | `clinic.json` → `email` | Set `value` and `status: "approved"`. The email link then appears on Contact, in the footer and in JSON-LD. |
| Address / map pin | `clinic.json` → `address`, `maps` | `maps.geo` feeds the schema.org `GeoCoordinates`. `shareUrl` is the place's stable `?cid=` link. |
| Opening hours | `clinic.json` → `hours.days` | Each day can have several sessions. A single session prints as "9:30 AM – 9:30 PM"; split sessions print as "Morning … & Evening …". One formatter (`src/lib/hours.ts`) feeds the top strip, hero chip, footer, Contact, FAQs, doctor pages, JSON-LD and the tenant file. |
| Google rating | `clinic.json` → `google` | Copy the rating and review count by hand and update `checkedOn`. Shown with that date; **never** emitted as `aggregateRating` (Google treats self-served review markup on local businesses as spam). |
| Colours / fonts | `content/brand.json` | Then run `npm run contrast` (must pass) and `npm run brand`. Fonts must be registered in `src/lib/theme.ts` (Fraunces and Plus Jakarta Sans today). Gold (`cta`) is a background only, with navy text on it. |
| Logo | Put the clinic's master in `images/`, point `images.json → logo.source.src` at it, then run `npm run brand` | Rebuilds the header mark, favicon, app icons and the social-share image. Today's mark is a **placeholder** we designed. |
| Photos | `content/images.json` | Add the file to `public/images/photos/`, then update `src`, `width`, `height` and `alt`, set `status: "approved"` and **remove `credit`**. Every current photo is representative stock (Unsplash). A photo without `credit` is treated as the clinic's own, so only then may it appear in the gallery JSON-LD or on a doctor card. |
| Gallery | `content/gallery.json` | Captions currently say "(representative photo)". Remove that once real photos are in. |
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
