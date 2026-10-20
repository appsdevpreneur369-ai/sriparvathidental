import Link from 'next/link';
import { siteClinic, siteNav } from '@/lib/content';
import { hoursSummary } from '@/lib/hours';
import { channels, directionsHref, resolveHref } from '@/lib/links';
import { fullAddress } from '@/lib/vars';
import { BookButton } from '../booking/BookButton';
import { DraftBadge } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark relative mt-8 overflow-hidden rounded-t-[2.5rem] bg-navy pb-32 text-onDarkMuted md:pb-10">
      <div aria-hidden="true" className="bg-waves pointer-events-none absolute inset-0" />
      <div className="container-site relative">
        <div className="grid gap-8 border-b border-onDark/10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <p className="font-heading text-3xl font-medium leading-tight text-onDark sm:text-4xl">
            A healthier smile is <span className="italic-accent text-cta">one visit away.</span>
          </p>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <BookButton className="btn-cta">
              <Icon name="calendar-check" className="h-4 w-4" /> Book Appointment
            </BookButton>
            {channels.call && (
              <a href={channels.call.href} className="btn-dark-ghost">
                <Icon name="phone" className="h-4 w-4" /> {channels.call.display}
              </a>
            )}
          </div>
        </div>
        <div className="grid gap-12 pt-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo onDark />
            <p className="mt-5 max-w-sm">{siteClinic.description.value}</p>
            <address className="mt-6 space-y-3 not-italic">
              <p className="flex gap-3">
                <Icon name="map-pin" className="mt-1 h-5 w-5 shrink-0 text-mintOnDark" />
                <span>
                  {fullAddress} <DraftBadge status={siteClinic.address.status} onDark />
                  <br />
                  <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-onDark underline">
                    Get directions <Icon name="arrow-up-right" className="h-4 w-4" />
                  </a>
                </span>
              </p>
              {channels.email && (
                <p className="flex items-center gap-3">
                  <Icon name="mail" className="h-5 w-5 shrink-0 text-mintOnDark" />
                  <a href={channels.email.href} className="font-semibold text-onDark hover:underline">
                    {channels.email.display}
                  </a>
                </p>
              )}
              <p className="flex gap-3">
                <Icon name="clock" className="mt-1 h-5 w-5 shrink-0 text-mintOnDark" />
                <span>
                  {hoursSummary(siteClinic.hours.days)} <DraftBadge status={siteClinic.hours.daysStatus} onDark />
                </span>
              </p>
            </address>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {siteNav.footer.map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <h2 className="font-body text-xs font-bold uppercase tracking-[0.2em] !text-cta">{g.title}</h2>
                <ul className="mt-3">
                  {g.links.map((l) => {
                    const r = resolveHref(l.href);
                    if (!r) return null;
                    const cls = 'inline-flex min-h-[44px] min-w-[44px] items-center hover:text-onDark hover:underline';
                    return (
                      <li key={l.label}>
                        {r.external ? (
                          <a href={r.href} className={cls}>
                            {l.label}
                          </a>
                        ) : (
                          <Link href={r.href} className={cls}>
                            {l.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-6 border-t border-onDark/10 pt-8 md:flex-row md:items-center md:justify-between">
          <SocialLinks />
          <p className="text-sm">
            © {year} {siteClinic.name.value}. Bookings and patient records on ClinicFlow247.
          </p>
        </div>
      </div>
    </footer>
  );
}
