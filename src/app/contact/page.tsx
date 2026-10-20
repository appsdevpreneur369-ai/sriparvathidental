import { BookButton } from '@/components/booking/BookButton';
import { MapFacade } from '@/components/contact/MapFacade';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon, WhatsAppIcon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { DraftBadge } from '@/components/ui/primitives';
import { siteClinic, sitePages } from '@/lib/content';
import { DAY_LABEL, formatSessions } from '@/lib/hours';
import { channels, directionsHref, generalWhatsappHref, mapEmbedSrc, mapsApproximate } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';
import { fullAddress } from '@/lib/vars';

const p = sitePages.contact;
export const metadata = pageMetadata({ path: '/contact', title: p.title, description: p.description });

/** Landmark-based directions (from the address and Google listing; the clinic may refine them). */
const WAYFINDING = [
  { icon: 'navigation', text: 'Head to Pathur Road Cross in Tadepalle, close to the Vijayawada–Guntur highway.' },
  { icon: 'map-pin', text: 'Look for Perreddy Complex near Reliance Digital.' },
  { icon: 'arrow-up-right', text: 'The clinic is on the first floor.' },
];

export default function ContactPage() {
  const c = siteClinic;
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Contact', path: '/contact' }]}>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <Icon name="navigation" className="h-4 w-4" /> Get directions
          </a>
          {channels.call && (
            <a href={channels.call.href} className="btn-ghost">
              <Icon name="phone" className="h-4 w-4" /> {channels.call.display}
            </a>
          )}
        </div>
      </PageHeader>
      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
              <h2 className="text-[1.8rem]">Get in touch</h2>
              <address className="mt-5 space-y-4 not-italic">
                <p className="flex gap-3">
                  <span className="icon-tile !h-10 !w-10">
                    <Icon name="map-pin" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="font-semibold">{c.name.value}</span>
                    <br />
                    {fullAddress} <DraftBadge status={c.address.status} />
                  </span>
                </p>
                {channels.call && (
                  <p className="flex items-center gap-3">
                    <span className="icon-tile !h-10 !w-10">
                      <Icon name="phone" className="h-5 w-5" />
                    </span>
                    <a href={channels.call.href} className="inline-flex min-h-[44px] items-center font-semibold text-primary underline">
                      {channels.call.display}
                    </a>
                  </p>
                )}
                <p className="flex items-center gap-3">
                  <span className="icon-tile !h-10 !w-10">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  {channels.email ? (
                    <a href={channels.email.href} className="font-semibold text-primary underline">
                      {channels.email.display}
                    </a>
                  ) : (
                    <span className="text-textSecondary">
                      Email address coming soon <DraftBadge status={c.email.status} />
                    </span>
                  )}
                </p>
              </address>
              <div className="mt-7 flex flex-wrap gap-3">
                <BookButton className="btn-cta">
                  <Icon name="calendar-check" /> Book online
                </BookButton>
                {generalWhatsappHref && (
                  <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                    <WhatsAppIcon /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-mintSoft px-6 py-4">
                <h2 className="text-[1.6rem]">Timings</h2>
                <OpenStatus hours={c.hours.days} timeZone={c.timezone} />
              </div>
              <table className="w-full text-left">
                <caption className="sr-only">Clinic opening hours, India Standard Time</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {c.hours.days.map((d) => (
                    <tr key={d.day}>
                      <th scope="row" className="px-6 py-3 font-semibold">
                        {DAY_LABEL[d.day]}
                      </th>
                      <td className="px-6 py-3 text-right text-textSecondary">{d.sessions.length ? formatSessions(d.sessions) : 'Closed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-border px-6 py-3 text-sm text-textSecondary">
                Festival days may differ — please call ahead on a holiday. <DraftBadge status={c.hours.daysStatus} />
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <MapFacade src={mapEmbedSrc} title={`Map: ${c.name.value}`} label="Show the clinic on Google Maps" />
            {mapsApproximate && (
              <p className="flex gap-2 text-sm text-textSecondary">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" /> The map shows the area; the clinic&apos;s exact pin will be added soon. <DraftBadge status={c.maps.status} />
              </p>
            )}
            <div className="rounded-[1.75rem] bg-navy p-6 text-onDark on-dark sm:p-8">
              <h2 className="text-xl !text-onDark">Finding us</h2>
              <ol className="mt-4 space-y-3">
                {WAYFINDING.map((w, i) => (
                  <li key={w.text} className="flex gap-3 text-onDarkMuted">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cta text-sm font-bold text-ctaInk">{i + 1}</span>
                    {w.text}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
