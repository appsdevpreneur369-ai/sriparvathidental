import Image from 'next/image';
import Link from 'next/link';
import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { Avatar, DraftBadge, SectionHead } from '@/components/ui/primitives';
import { getImage, headDoctor, siteAbout, siteClinic, sitePages, sitePlan } from '@/lib/content';
import { patientBenefits } from '@/lib/plan';
import { pageMetadata } from '@/lib/seo';
import { VARS } from '@/lib/vars';

const p = sitePages.about;
export const metadata = pageMetadata({ path: '/about', title: p.title, description: p.description });

export default function AboutPage() {
  const a = siteAbout;
  const headPhoto = headDoctor.photo ? getImage(headDoctor.photo) : null;
  const story = getImage(a.story.image);
  const google = siteClinic.google;
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} image={getImage('clinic-treatment-rooms')} imageLayout="wide" crumbs={[{ name: 'About', path: '/about' }]} badge={<DraftBadge status={a.status} />} />

      <section className="section">
        <div className="container-site grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-4">{a.story.title}</h2>
            {a.story.paragraphs.map((t, i) => (
              <p key={t.slice(0, 20)} className={i === 0 ? 'mt-6 font-heading text-[1.3rem] leading-snug text-navy' : 'mt-4 text-textSecondary'}>
                {t}
              </p>
            ))}
          </div>
          <figure className="relative">
            <div aria-hidden="true" className="absolute -right-4 -top-4 h-full w-full rounded-blob bg-mintSoft" />
            <Image src={story.src} alt={story.alt} width={story.width} height={story.height} sizes="(min-width:1024px) 40vw, 100vw" className="relative aspect-[4/3] w-full rounded-blob object-cover shadow-lift" style={{ objectPosition: story.objectPosition }} />
            <figcaption className="relative mt-3 text-xs text-textSecondary">{story.credit ? 'Representative photo.' : story.alt}</figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- Lead dentist ---------- */}
      <section className="on-dark relative overflow-hidden bg-navy py-16 text-onDark sm:py-24" aria-labelledby="clinic-head">
        <div aria-hidden="true" className="bg-waves pointer-events-none absolute inset-0" />
        <div className="container-site relative grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
          {headPhoto ? (
            <div className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-blob lg:mx-0">
              <Image src={headPhoto.src} alt={headPhoto.alt} width={headPhoto.width} height={headPhoto.height} sizes="380px" className="aspect-[4/5] w-full object-cover" style={{ objectPosition: headPhoto.objectPosition }} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Avatar initials={headDoctor.initials} size="lg" className="!h-44 !w-44 !text-7xl" />
              <span className="text-xs text-onDarkMuted">Photo coming soon</span>
            </div>
          )}
          <div>
            <p className="eyebrow">{a.clinicHead.eyebrow}</p>
            <h2 id="clinic-head" className="mt-4 !text-onDark">
              {a.clinicHead.title} <DraftBadge status={headDoctor.status} onDark />
            </h2>
            <p className="mt-2 text-lg font-semibold text-mintOnDark">
              {headDoctor.qualification} · {headDoctor.specialty}
            </p>
            <p className="mt-5 max-w-2xl text-lg text-onDark">{a.clinicHead.lead}</p>
            {headDoctor.bio.slice(0, 2).map((b) => (
              <p key={b.slice(0, 24)} className="mt-4 max-w-2xl text-onDarkMuted">
                {b}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-3">
              <BookButton className="btn-cta" prefill={{ doctor: headDoctor.slug }}>
                <Icon name="calendar-check" /> {a.clinicHead.bookLabel}
              </BookButton>
              <Link href={`/doctors/${headDoctor.slug}`} className="btn-dark-ghost">
                {a.clinicHead.profileLabel} <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow="Our promise" title={a.values.title} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {a.values.items.map((v) => (
              <li key={v.title} className="reveal rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft">
                <span className="icon-tile">
                  <Icon name={v.icon} />
                </span>
                <h3 className="mt-5 text-[1.15rem]">{v.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-textSecondary">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-site grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-dashed border-primary/40 bg-mintSoft p-8">
            <Icon name="users" className="h-7 w-7 text-primary" />
            <h2 className="mt-3 text-2xl">{a.team.title}</h2>
            <p className="mt-2 text-textSecondary">{a.team.lead}</p>
          </div>
          {google && (
            <a href={google.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-6 rounded-[1.75rem] border border-border bg-surface p-8 shadow-soft transition-shadow hover:shadow-lift">
              <span className="font-heading text-6xl text-navy">{VARS.googleRating}</span>
              <span>
                <span className="block text-lg font-semibold">Rated by patients on Google</span>
                <span className="block text-textSecondary">
                  {google.reviewCount} reviews · checked {VARS.googleChecked}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 font-bold text-primary group-hover:underline">
                  Read the reviews <Icon name="arrow-up-right" className="h-4 w-4" />
                </span>
              </span>
            </a>
          )}
        </div>
      </section>

      <section className="section bg-surfaceAlt">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHead eyebrow="Powered by ClinicFlow247" title={a.starterFeatures.title} lead={a.starterFeatures.lead} />
          <div>
            <ul className="grid gap-3">
              {patientBenefits(sitePlan).map((b) => (
                <li key={b} className="flex gap-3 rounded-2xl bg-surface px-4 py-3 shadow-soft">
                  <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} /> {b}
                </li>
              ))}
            </ul>
            <BookButton className="btn-cta mt-8">
              <Icon name="calendar-check" /> Book an appointment
            </BookButton>
          </div>
        </div>
      </section>
    </>
  );
}
