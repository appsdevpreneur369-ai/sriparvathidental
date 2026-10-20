import Image from 'next/image';
import Link from 'next/link';
import { BookButton } from '@/components/booking/BookButton';
import { ArticleCard, DoctorCard, TreatmentCard } from '@/components/cards';
import { MapFacade } from '@/components/contact/MapFacade';
import { HeroHoursChip } from '@/components/sections/HeroHoursChip';
import { Icon, WhatsAppIcon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { Accordion, DraftBadge, SectionHead } from '@/components/ui/primitives';
import { articles, categories, getImage, headDoctor, siteClinic, siteFaqs, siteGallery, siteHome, sitePages, sitePlan, siteRouting } from '@/lib/content';
import { dayRangeShort, formatSessions, groupDays } from '@/lib/hours';
import { channels, directionsHref, generalWhatsappHref, mapEmbedSrc } from '@/lib/links';
import { patientBenefits } from '@/lib/plan';
import { pageMetadata } from '@/lib/seo';
import { fill, fullAddress, VARS } from '@/lib/vars';

export const metadata = pageMetadata({ path: '/', title: sitePages.home.title, description: sitePages.home.description, absoluteTitle: true });

export default function HomePage() {
  const h = siteHome;
  const hero = getImage(h.hero.image);
  const about = getImage(h.about.image);
  const homeFaqs = siteFaqs.items.filter((f) => f.home);
  const [hoursChip, doctorChip, bookChip] = h.hero.chips;
  const google = siteClinic.google;
  const [featured, ...restCats] = categories;
  const [leadArticle, ...moreArticles] = articles;

  return (
    <>
      {/* ---------- Hero (dark) ---------- */}
      <section className="on-dark relative overflow-hidden bg-navy text-onDark xl:-mt-[88px] xl:pt-[88px]">
        <div aria-hidden="true" className="bg-waves pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full border border-onDark/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-32 h-[24rem] w-[24rem] rounded-full border border-onDark/5" />
        <div className="container-site relative grid items-center gap-14 pb-36 pt-12 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:pb-44 lg:pt-20">
          <div>
            <p className="eyebrow eyebrow-dark animate-fade-up">
              {h.hero.badge} <DraftBadge status={h.status} onDark />
            </p>
            <h1 className="mt-6 animate-fade-up !text-onDark [animation-delay:80ms]">
              <span className="block">{h.hero.titleLine1}</span>
              <span className="italic-accent block text-cta">{h.hero.titleLine2}</span>
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg text-onDarkMuted [animation-delay:160ms]">{h.hero.lead}</p>
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <BookButton className="btn-cta">
                <Icon name="calendar-check" /> {h.hero.primaryCta}
              </BookButton>
              {channels.call ? (
                <a href={channels.call.href} className="btn-dark-ghost">
                  <Icon name="phone" className="h-4 w-4" /> Call {channels.call.display}
                </a>
              ) : (
                <Link href={h.hero.secondaryCta.href} className="btn-dark-ghost">
                  {h.hero.secondaryCta.label} <Icon name="arrow-right" className="h-4 w-4" />
                </Link>
              )}
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[0.95rem] font-medium text-onDark">
              {h.hero.checks.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-navy">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div aria-hidden="true" className="absolute -right-3 -top-3 h-full w-full rounded-blob border-2 border-cta/60" />
            <div className="relative overflow-hidden rounded-blob shadow-2xl">
              <Image src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} priority sizes="(min-width: 1024px) 40vw, 92vw" className="aspect-[5/6] w-full object-cover sm:aspect-[4/4.2]" style={{ objectPosition: hero.objectPosition }} />
            </div>
            {google && (
              <a href={google.url} target="_blank" rel="noopener noreferrer" className="absolute -left-2 top-6 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-text shadow-lift transition-transform hover:-translate-y-0.5 sm:-left-10">
                <span className="font-heading text-3xl font-semibold text-navy">{VARS.googleRating}</span>
                <span className="leading-tight">
                  <span className="flex gap-0.5 text-cta" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                        <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                      </svg>
                    ))}
                  </span>
                  <span className="block text-xs font-semibold text-textSecondary">
                    {google.reviewCount} Google reviews<span className="sr-only">, rated {VARS.googleRating} out of 5, checked {VARS.googleChecked}</span>
                  </span>
                </span>
              </a>
            )}
            <div className="absolute -right-2 bottom-24 hidden max-w-[15rem] items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-text shadow-lift xs:flex sm:-right-8">
              <span className="icon-tile !h-10 !w-10">
                <Icon name={hoursChip.icon} className="h-5 w-5" />
              </span>
              <span className="text-[0.8rem] font-semibold leading-snug sm:text-sm">
                <HeroHoursChip hours={siteClinic.hours.days} timeZone={siteClinic.timezone} fallback={fill(hoursChip.text)} />
              </span>
            </div>
            <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-cta px-4 py-3 text-ctaInk shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy font-heading text-lg text-cta">{headDoctor.initials}</span>
              <span className="leading-tight">
                <span className="block font-heading text-[1.05rem] font-semibold">{doctorChip.text}</span>
                <span className="text-xs font-semibold">{doctorChip.sub}</span>
              </span>
            </div>
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-14 w-full text-background sm:h-20">
          <path fill="currentColor" d="M0 80V40c240 32 480 40 720 24S1200 8 1440 32v48z" />
        </svg>
      </section>

      {/* ---------- At a glance ---------- */}
      <section aria-label="Clinic at a glance" className="container-site relative z-10 -mt-24 lg:-mt-28">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border shadow-lift lg:grid-cols-4">
          {h.stats.items.map((s) => (
            <li key={s.label} className="flex flex-col gap-1 bg-surface p-5 sm:p-7">
              <span className="flex items-center gap-2 text-primary">
                <Icon name={s.icon} className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">{s.label}</span>
              </span>
              <span className="font-heading text-[2.1rem] font-semibold leading-none text-navy sm:text-[2.6rem]">{fill(s.value)}</span>
              <span className="text-sm text-textSecondary">{fill(s.sub)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-textSecondary">{bookChip.text} · {bookChip.sub}</p>
      </section>

      {/* ---------- How can we help? ---------- */}
      <section className="section !pb-10" aria-labelledby="symptoms">
        <div className="container-site">
          <SectionHead eyebrow={h.symptoms.eyebrow} title={h.symptoms.title} lead={h.symptoms.lead} id="symptoms" center />
          <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
            {siteRouting.problems.map((p) => (
              <li key={p.id}>
                <BookButton prefill={{ problem: p.id }} className="group inline-flex min-h-[52px] items-center gap-3 rounded-full border border-border bg-surface py-2 pl-2 pr-5 text-left font-semibold text-text shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mintSoft text-primary transition-colors group-hover:bg-primary group-hover:text-onDark">
                    <Icon name={p.icon} className="h-4 w-4" />
                  </span>
                  {p.label}
                </BookButton>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Welcome ---------- */}
      <section className="section" aria-labelledby="about">
        <div className="container-site grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
              <Image src={about.src} alt={about.alt} width={about.width} height={about.height} sizes="(min-width:1024px) 45vw, 100vw" className="aspect-[5/4] w-full object-cover" style={{ objectPosition: about.objectPosition }} />
            </div>
            <div className="absolute -bottom-6 -right-2 rounded-[1.5rem] bg-navy px-6 py-5 text-onDark shadow-lift sm:right-8">
              <span className="block font-heading text-4xl font-semibold text-cta">{fill(h.about.badgeValue)}</span>
              <span className="block text-sm font-semibold text-onDarkMuted">{h.about.badgeLabel}</span>
            </div>
            <p className="mt-3 text-xs text-textSecondary">Representative photo</p>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow">{h.about.eyebrow}</p>
            <h2 id="about" className="mt-4 text-balance">
              {h.about.title}
            </h2>
            {h.about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="mt-5 text-textSecondary">
                {p}
              </p>
            ))}
            <ul className="mt-7 grid gap-3">
              {h.about.points.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-2xl bg-mintSoft px-4 py-3 font-semibold">
                  <Icon name="badge-check" className="h-5 w-5 shrink-0 text-primary" /> {p}
                </li>
              ))}
            </ul>
            <Link href={h.about.cta.href} className="btn-ghost mt-8">
              {h.about.cta.label} <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Treatments (bento) ---------- */}
      <section className="section bg-surfaceAlt" aria-labelledby="treatments">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow={h.treatments.eyebrow} title={h.treatments.title} lead={fill(h.treatments.lead ?? '')} id="treatments" />
            <Link href="/treatments" className="btn-ghost mb-10 sm:mb-14">
              All {categories.length} treatments <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <li className="md:col-span-2 lg:row-span-2">
              <TreatmentCard c={featured} layout="feature" className="h-full" />
            </li>
            {restCats.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <TreatmentCard c={c} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Doctor ---------- */}
      <section className="section" aria-labelledby="doctors">
        <div className="container-site">
          <SectionHead eyebrow={h.doctors.eyebrow} title={h.doctors.title} lead={fill(h.doctors.lead ?? '')} id="doctors" />
          <DoctorCard d={headDoctor} />
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <section className="section !pt-0" aria-labelledby="why">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHead eyebrow={h.why.eyebrow} title={h.why.title} id="why" />
            <BookButton className="btn-cta -mt-4">
              <Icon name="calendar-check" className="h-4 w-4" /> Book a check-up
            </BookButton>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {h.why.points.map((p, i) => (
              <li key={p.title} className="reveal group rounded-[1.5rem] border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="icon-tile group-hover:bg-primary group-hover:text-onDark">
                    <Icon name={p.icon} className="h-6 w-6" />
                  </span>
                  <span aria-hidden="true" className="font-heading text-3xl text-border">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5">{p.title}</h3>
                <p className="mt-2 text-[0.95rem] text-textSecondary">{fill(p.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- What patients mention (Google) ---------- */}
      {google && (
        <section className="on-dark relative overflow-hidden bg-navy py-16 text-onDark sm:py-20" aria-labelledby="reviews">
          <div aria-hidden="true" className="bg-waves pointer-events-none absolute inset-0" />
          <div className="container-site relative grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
            <div className="flex items-center gap-5">
              <span className="font-heading text-7xl font-semibold leading-none text-cta">{VARS.googleRating}</span>
              <span>
                <span className="flex gap-1 text-cta" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} viewBox="0 0 20 20" className="h-5 w-5 fill-current">
                      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                    </svg>
                  ))}
                </span>
                <span className="mt-1 block text-sm text-onDarkMuted">
                  {google.reviewCount} reviews on Google · checked {VARS.googleChecked}
                </span>
              </span>
            </div>
            <div>
              <h2 id="reviews" className="text-2xl !text-onDark sm:text-3xl">
                What patients mention most
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {google.reviewTopics.map((t) => (
                  <li key={t} className="rounded-full border border-onDark/20 bg-onDark/5 px-4 py-1.5 text-sm font-semibold text-onDark">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <a href={google.url} target="_blank" rel="noopener noreferrer" className="btn-dark-ghost">
              Read the reviews <Icon name="arrow-up-right" className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      {/* ---------- How it works ---------- */}
      <section className="section" aria-labelledby="steps">
        <div className="container-site">
          <SectionHead eyebrow={h.steps.eyebrow} title={h.steps.title} id="steps" center />
          <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
            <span aria-hidden="true" className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-mint via-primary to-cta md:block" />
            {h.steps.items.map((s, i) => (
              <li key={s.title} className="reveal relative flex gap-4 md:block md:text-center">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-onDark shadow-soft md:mx-auto">
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-primary md:mt-5">Step {i + 1}</p>
                  <h3 className="mt-1">{s.title}</h3>
                  <p className="mt-2 text-[0.95rem] text-textSecondary">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid items-center gap-6 rounded-[1.75rem] border border-border bg-mintSoft p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {patientBenefits(sitePlan).slice(0, 6).map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[0.95rem] font-medium">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={3} /> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <BookButton className="btn-cta whitespace-nowrap">
                <Icon name="calendar-check" /> Book Appointment
              </BookButton>
              {generalWhatsappHref && (
                <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" className="btn-whatsapp whitespace-nowrap">
                  <WhatsAppIcon /> WhatsApp us
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Gallery mosaic ---------- */}
      <section className="section bg-surfaceAlt" aria-labelledby="gallery">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow={h.gallery.eyebrow} title={h.gallery.title} lead={h.gallery.lead} id="gallery" />
            <Link href="/gallery" className="btn-ghost mb-10 sm:mb-14">
              View gallery <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid auto-rows-[160px] grid-cols-2 gap-4 sm:auto-rows-[200px] lg:grid-cols-4">
            {siteGallery.items.slice(0, 5).map((g, i) => {
              const img = getImage(g.image);
              return (
                <li key={g.image} className={`reveal group relative overflow-hidden rounded-[1.5rem] ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <Image src={img.src} alt={img.alt} fill sizes={i === 0 ? '(min-width:1024px) 50vw, 100vw' : '(min-width:1024px) 25vw, 50vw'} className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: img.objectPosition }} />
                  <span className="absolute bottom-3 left-3 right-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-text backdrop-blur">{g.caption}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---------- Education ---------- */}
      <section className="section" aria-labelledby="education">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow={h.education.eyebrow} title={h.education.title} lead={h.education.lead} id="education" />
            <Link href="/patient-education" className="btn-ghost mb-10 sm:mb-14">
              All guides <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">{leadArticle && <ArticleCard a={leadArticle.meta} big />}</div>
            {moreArticles.slice(0, 3).map((a) => (
              <ArticleCard key={a.meta.slug} a={a.meta} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ + Visit ---------- */}
      <section className="section bg-surfaceAlt" aria-labelledby="faq">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow={h.faq.eyebrow} title={h.faq.title} id="faq" />
            <Accordion items={homeFaqs.map((f) => ({ q: fill(f.q), a: fill(f.a) }))} name="home-faq" />
            <Link href="/faqs" className="mt-5 inline-flex min-h-[44px] items-center gap-1 font-bold text-primary hover:underline">
              More questions <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <SectionHead eyebrow={h.visit.eyebrow} title={h.visit.title} lead={h.visit.lead} />
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                <span className="font-heading text-lg">Clinic timings</span>
                <span className="rounded-full bg-mintSoft px-3 py-1 text-sm">
                  <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />
                </span>
              </div>
              <dl className="divide-y divide-border px-6">
                {groupDays(siteClinic.hours.days).map((g) => (
                  <div key={g.days[0]} className="flex flex-wrap justify-between gap-2 py-3.5">
                    <dt className="font-semibold">{dayRangeShort(g.days)}</dt>
                    <dd className="text-textSecondary sm:text-right">{g.sessions.length ? formatSessions(g.sessions) : 'Closed'}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-border p-4">
                <MapFacade src={mapEmbedSrc} title={`Map: ${siteClinic.name.value}`} label="Show the map" />
              </div>
              <div className="border-t border-border bg-surfaceAlt px-6 py-5">
                <p className="flex gap-3">
                  <Icon name="map-pin" className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span>{fullAddress}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <Icon name="navigation" className="h-4 w-4" /> Directions
                  </a>
                  {channels.call && (
                    <a href={channels.call.href} className="btn-primary">
                      <Icon name="phone" className="h-4 w-4" /> {channels.call.display}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-site py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-cta px-6 py-14 text-center text-ctaInk sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-onDark/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-ctaHover" />
          <h2 className="relative !text-ctaInk">{h.cta.title}</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-lg font-medium">{h.cta.lead}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <BookButton className="btn bg-navy text-onDark hover:bg-navySoft">
              <Icon name="calendar-check" /> {h.cta.button}
            </BookButton>
            {channels.call && (
              <a href={channels.call.href} className="btn border-2 border-ctaInk/40 hover:bg-ctaInk/10">
                <Icon name="phone" className="h-4 w-4" /> {channels.call.display}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
