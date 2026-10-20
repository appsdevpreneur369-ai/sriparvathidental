import Image from 'next/image';
import Link from 'next/link';
import { getDoctorById, getImage, headDoctor } from '@/lib/content';
import type { Category, Doctor } from '@/lib/content/schemas';
import { cn } from '@/lib/cn';
import { BookButton } from './booking/BookButton';
import { Icon } from './ui/Icon';
import { DraftBadge } from './ui/primitives';

/**
 * Treatment tile. `layout="feature"` = photo fills the tile with text on a navy scrim (bento large tiles);
 * default = photo on top, text below.
 */
export function TreatmentCard({ c, headingLevel: H = 'h3', priority, layout = 'stack', className }: { c: Category; headingLevel?: 'h2' | 'h3'; priority?: boolean; layout?: 'stack' | 'feature'; className?: string }) {
  const img = getImage(c.image);
  const docs = c.doctors.map((id) => getDoctorById(id)?.displayName).filter(Boolean);
  const who = c.confirmSpecialist ? `First consultation with ${headDoctor.displayName}` : docs.join(' · ');
  if (layout === 'feature')
    return (
      <Link href={`/treatments/${c.slug}`} className={cn('reveal group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-navy shadow-soft transition-shadow hover:shadow-lift', className)}>
        <Image src={img.src} alt={img.alt} fill priority={priority} sizes="(min-width:1024px) 50vw, 100vw" className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: img.objectPosition }} />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="on-dark relative p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cta text-ctaInk">
            <Icon name={c.icon} className="h-6 w-6" />
          </span>
          <H className="mt-4 text-[1.7rem] !text-onDark">
            {c.title} <DraftBadge status={c.status} onDark />
          </H>
          <p className="mt-2 max-w-md text-onDark/90">{c.short}</p>
          <span className="mt-5 inline-flex items-center gap-2 font-bold text-cta">
            {c.subTreatments.length} treatments <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    );
  return (
    <Link href={`/treatments/${c.slug}`} className={cn('reveal group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-surface p-2 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift', className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
        <Image src={img.src} alt={img.alt} width={img.width} height={img.height} priority={priority} sizes="(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface/95 text-primary shadow-soft">
          <Icon name={c.icon} className="h-5 w-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        <H className="text-[1.3rem] group-hover:text-primaryDeep">
          {c.title} <DraftBadge status={c.status} />
        </H>
        <p className="mt-2 flex-1 text-[0.95rem] text-textSecondary">{c.short}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-textSecondary">{who}</span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mintSoft text-primary transition-colors group-hover:bg-primary group-hover:text-onDark">
            <Icon name="arrow-up-right" className="h-4 w-4" />
            <span className="sr-only">{c.subTreatments.length} treatments</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Doctor card: photo (own photos only) or an initials avatar on a teal panel. */
export function DoctorCard({ d, headingLevel: H = 'h3', className }: { d: Doctor; index?: number; headingLevel?: 'h2' | 'h3'; className?: string }) {
  const photo = d.photo ? getImage(d.photo) : null;
  return (
    <article className={cn('reveal grid overflow-hidden rounded-[2rem] border border-border bg-surface shadow-soft md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]', className)}>
      <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primaryDeep">
        <span aria-hidden="true" className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-mint/25" />
        <span aria-hidden="true" className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-cta/30" />
        {photo ? (
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" style={{ objectPosition: photo.objectPosition ?? '50% 25%' }} />
        ) : (
          <span aria-hidden="true" className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-onDark/30 bg-onDark/10 font-heading text-6xl font-semibold text-onDark backdrop-blur">
            {d.initials}
          </span>
        )}
        {!photo && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy/60 px-3 py-1 text-xs font-medium text-onDark">Photo coming soon</span>}
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        {d.isHead && <p className="eyebrow w-fit">{d.role}</p>}
        <H className="mt-3 text-3xl">
          <Link href={`/doctors/${d.slug}`} className="inline-flex min-h-[44px] items-center hover:text-primaryDeep">
            {d.displayName}
          </Link>{' '}
          <DraftBadge status={d.status} />
        </H>
        <p className="mt-1 font-semibold text-primary">{d.qualification}</p>
        <p className="text-[0.95rem] text-textSecondary">{d.specialty}</p>
        {d.experienceYears && (
          <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-mintSoft px-3 py-1 text-sm font-semibold text-primaryDeep">
            <Icon name="award" className="h-4 w-4" /> {d.experienceYears}+ years of experience
          </p>
        )}
        <p className="mt-4 text-textSecondary">{d.summary}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {d.focus.map((f) => (
            <li key={f} className="rounded-full border border-border bg-surfaceAlt px-3 py-1 text-sm font-medium text-text">
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <BookButton className="btn-primary !min-h-[46px]" prefill={{ doctor: d.slug }} ariaLabel={`Book with ${d.displayName}`}>
            <Icon name="calendar-check" className="h-4 w-4" /> Book with {d.displayName}
          </BookButton>
          <Link href={`/doctors/${d.slug}`} className="inline-flex min-h-[46px] items-center gap-1 px-3 font-bold text-primary hover:underline" aria-label={`Profile of ${d.displayName}`}>
            Full profile <Icon name="arrow-up-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ArticleCard({ a, big }: { a: { slug: string; title: string; description: string; image: string; category: string; readingMinutes: number }; big?: boolean }) {
  const img = getImage(a.image);
  return (
    <article className={cn('reveal group h-full overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift')}>
      <Link href={`/patient-education/${a.slug}`} className={cn('flex h-full flex-col', big && 'md:grid md:grid-cols-[1.1fr_1fr]')}>
        <div className="overflow-hidden">
          <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes={big ? '(min-width:1024px) 34vw, 100vw' : '(min-width:1024px) 25vw, 100vw'} className={cn('w-full object-cover transition-transform duration-700 group-hover:scale-105', big ? 'aspect-[16/10] md:aspect-auto md:h-full' : 'aspect-[16/10]')} />
        </div>
        <div className={cn('flex flex-1 flex-col p-5', big && 'sm:p-8')}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {a.category} · {a.readingMinutes} min read
          </p>
          <h3 className={cn('mt-2 group-hover:text-primaryDeep', big ? 'text-[1.75rem]' : 'text-[1.2rem]')}>{a.title}</h3>
          <p className={cn('mt-2 flex-1 text-[0.94rem] text-textSecondary', !big && 'line-clamp-3')}>{a.description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
            Read the guide <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Compact doctor row for sidebars ("Who treats you"). */
export function DoctorMini({ d }: { d: Doctor }) {
  const photo = d.photo ? getImage(d.photo) : null;
  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-surface p-4 shadow-soft">
      {photo ? (
        <Image src={photo.src} alt={photo.alt} width={64} height={64} sizes="64px" className="h-16 w-16 rounded-2xl object-cover" style={{ objectPosition: photo.objectPosition ?? '50% 25%' }} />
      ) : (
        <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primaryDeep font-heading text-2xl text-onDark">
          {d.initials}
        </span>
      )}
      <div className="min-w-0">
        <Link href={`/doctors/${d.slug}`} className="inline-flex min-h-[44px] items-center font-heading text-lg hover:text-primaryDeep hover:underline">
          {d.displayName}
        </Link>
        <p className="-mt-1 text-sm text-textSecondary">
          {d.qualification} · {d.specialty}
        </p>
      </div>
    </div>
  );
}
