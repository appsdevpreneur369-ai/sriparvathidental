import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { Avatar, DraftBadge } from '@/components/ui/primitives';
import { categories, getDoctor, getImage, siteClinic, siteDoctors } from '@/lib/content';
import { DAY_SHORT, formatSession } from '@/lib/hours';
import { physicianJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => siteDoctors.map((d) => ({ slug: d.slug }));

export function generateMetadata({ params }: { params: { slug: string } }) {
  const d = getDoctor(params.slug);
  if (!d) return {};
  return pageMetadata({
    path: `/doctors/${d.slug}`,
    title: `${d.displayName}, ${d.qualification.replace(/ \(.+\)/, '')} — Dentist in ${siteClinic.address.locality.split(',').pop()!.trim()}`,
    description: `${d.displayName} (${d.qualification.replace(/ \(.+\)/, '')}) at ${siteClinic.name.value}, ${siteClinic.address.street}, ${siteClinic.address.locality.split(',')[0]}. ${d.summary}`,
  });
}

export default function DoctorPage({ params }: { params: { slug: string } }) {
  const d = getDoctor(params.slug);
  if (!d) notFound();
  const treats = categories.filter((c) => c.doctors.includes(d.id) || c.subTreatments.some((s) => s.doctors?.includes(d.id)));
  const photo = d.photo ? getImage(d.photo) : null;
  const photo2 = d.photoSecondary ? getImage(d.photoSecondary) : null;
  const facts = [
    { icon: 'badge-check', label: 'Qualification', value: d.qualification.replace(/ \(.+\)/, '') },
    { icon: 'stethoscope', label: 'Role', value: d.isHead ? d.role : d.specialty },
    ...(d.experienceYears ? [{ icon: 'award', label: 'Experience', value: `${d.experienceYears}+ years` }] : []),
    { icon: 'sparkles', label: 'Treatment areas', value: String(treats.length) },
  ];
  return (
    <>
      <JsonLd data={physicianJsonLd(d)} />
      <PageHeader
        title={d.displayName}
        image={photo ?? undefined}
        imageLayout="portrait"
        crumbs={[{ name: 'Doctors', path: '/doctors' }, { name: d.displayName, path: `/doctors/${d.slug}` }]}
        badge={<DraftBadge status={d.status} />}
      >
        <div className="mt-6 flex flex-wrap items-center gap-6">
          {!photo && <Avatar initials={d.initials} size="lg" />}
          <div>
            <p className="font-heading text-xl text-primaryDeep">
              {d.qualification} · {d.specialty}
            </p>
            {!photo && <p className="mt-1 text-sm text-textSecondary">Photo coming soon</p>}
            <BookButton className="btn-cta mt-5" prefill={{ doctor: d.slug }}>
              <Icon name="calendar-check" /> Book with {d.displayName}
            </BookButton>
          </div>
        </div>
      </PageHeader>

      <section aria-label="At a glance" className="container-site relative z-10 -mt-8">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map((f) => (
            <li key={f.label} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lift">
              <span className="icon-tile !h-11 !w-11">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-textSecondary">{f.label}</span>
                <span className="block font-heading text-[1.05rem] text-text">{f.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="eyebrow">About the doctor</p>
            <h2 className="mt-4">Meet {d.displayName}</h2>
            <div className="prose-site mt-5">
              {d.bio.map((b) => (
                <p key={b.slice(0, 24)}>{b}</p>
              ))}
            </div>
            <h2 className="mt-10 text-2xl">Areas of focus</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {d.focus.map((f) => (
                <li key={f} className="flex items-center gap-3 rounded-2xl bg-mintSoft px-4 py-3 font-semibold">
                  <Icon name="badge-check" className="h-5 w-5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            {!d.registrationNumber && (
              <p className="mt-8 text-sm text-textSecondary">
                Dental Council registration number: being confirmed. <DraftBadge status="placeholder" />
              </p>
            )}
            {d.registrationNumber && <p className="mt-8 text-sm text-textSecondary">Dental Council registration no. {d.registrationNumber}</p>}
          </div>
          <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
            {photo2 && (
              <figure className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-soft">
                <Image src={photo2.src} alt={photo2.alt} width={photo2.width} height={photo2.height} sizes="(min-width:1024px) 30vw, 100vw" className="aspect-[4/5] w-full object-cover" style={{ objectPosition: photo2.objectPosition ?? '50% 20%' }} />
              </figure>
            )}
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-soft">
              <h2 className="bg-navy px-6 py-4 text-lg !text-onDark">Consultation times</h2>
              <ul className="space-y-2 px-6 py-5 text-textSecondary">
                {d.consultation.map((c, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-semibold text-text">
                      {DAY_SHORT[c.days[0]]}
                      {c.days.length > 1 && `–${DAY_SHORT[c.days[c.days.length - 1]]}`}
                    </span>
                    <span className="text-right">{formatSession(c)}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border px-6 py-3 text-sm text-textSecondary">
                Follows the clinic&apos;s opening hours. <DraftBadge status={d.consultationStatus} />
              </p>
            </div>
            {treats.length > 0 && (
              <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft">
                <h2 className="text-lg">Treatments</h2>
                <ul className="mt-2">
                  {treats.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/treatments/${c.slug}`} className="flex min-h-[44px] items-center justify-between gap-2 border-b border-border font-medium text-text last:border-0 hover:text-primary">
                        {c.title} <Icon name="chevron-right" className="h-4 w-4 text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
