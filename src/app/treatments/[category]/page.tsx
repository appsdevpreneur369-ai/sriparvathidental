import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { DoctorMini, TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { Accordion, DraftBadge } from '@/components/ui/primitives';
import { categories, getCategory, getDoctorById, getImage, headDoctor, siteServices } from '@/lib/content';
import { faqJsonLd, treatmentJsonLd } from '@/lib/jsonld';
import { channels } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => categories.map((c) => ({ category: c.slug }));

export function generateMetadata({ params }: { params: { category: string } }) {
  const c = getCategory(params.category);
  if (!c) return {};
  return pageMetadata({ path: `/treatments/${c.slug}`, title: c.seo.title, description: c.seo.description });
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const c = getCategory(params.category);
  if (!c) notFound();
  const path = `/treatments/${c.slug}`;
  const doctors = c.doctors.map(getDoctorById).filter((d): d is NonNullable<typeof d> => !!d);
  const idx = categories.findIndex((x) => x.slug === c.slug);
  const others = [1, 2, 3].map((n) => categories[(idx + n) % categories.length]);
  return (
    <>
      <JsonLd data={[treatmentJsonLd(c, path), ...(c.faqs.length ? [faqJsonLd(c.faqs)] : [])]} />
      <PageHeader title={c.title} intro={c.short} image={getImage(c.image)} crumbs={[{ name: 'Treatments', path: '/treatments' }, { name: c.shortTitle, path }]} badge={<DraftBadge status={c.status} />}>
        <div className="mt-8 flex flex-wrap gap-3">
          <BookButton className="btn-cta" prefill={{ treatment: c.slug }}>
            <Icon name="calendar-check" /> Book for {c.shortTitle.toLowerCase()}
          </BookButton>
          {channels.call && (
            <a href={channels.call.href} className="btn-ghost">
              <Icon name="phone" className="h-4 w-4" /> Ask a question
            </a>
          )}
        </div>
      </PageHeader>

      <section className="section">
        <div className="container-site grid gap-14 lg:grid-cols-[1.55fr_1fr]">
          <div>
            <div className="prose-site">
              {c.intro.map((t, i) => (
                <p key={t.slice(0, 24)} className={i === 0 ? 'font-heading text-[1.35rem] leading-snug text-navy' : 'text-lg'}>
                  {t}
                </p>
              ))}
            </div>
            {c.confirmSpecialist && (
              <p className="mt-2 flex max-w-prose gap-3 rounded-2xl border border-cta/50 bg-warningSoft px-4 py-3 text-[0.95rem]">
                <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-warningText" />
                <span>
                  Your first consultation is with {headDoctor.displayName}, who examines you and plans the next steps. <DraftBadge status="placeholder" />
                </span>
              </p>
            )}

            <h2 className="mt-14">What&apos;s included</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {c.subTreatments.map((s) => (
                <li key={s.slug} className="reveal flex flex-col rounded-[1.5rem] border border-border bg-surface p-5 shadow-soft">
                  <h3 className="text-[1.15rem]">{s.title}</h3>
                  <p className="mt-1.5 flex-1 text-[0.95rem] text-textSecondary">{s.summary}</p>
                  <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-mintSoft px-3 py-1 text-sm font-semibold text-primaryDeep">
                    <Icon name="clock" className="h-4 w-4" /> {s.visits}
                  </p>
                </li>
              ))}
            </ul>

            <h2 className="mt-14">How it usually goes</h2>
            <ol className="relative mt-8 space-y-8 border-l-2 border-mint pl-8">
              {c.steps.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="absolute -left-[3.05rem] flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary font-heading text-onDark">{i + 1}</span>
                  <h3 className="text-[1.15rem]">{s.title}</h3>
                  <p className="mt-1 text-textSecondary">{s.text}</p>
                </li>
              ))}
            </ol>

            {c.faqs.length > 0 && (
              <>
                <h2 className="mb-6 mt-14">Questions about {c.shortTitle.toLowerCase()}</h2>
                <Accordion items={c.faqs.map((f) => ({ q: f.q, a: f.a }))} />
              </>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
            <div className="on-dark relative overflow-hidden rounded-[1.75rem] bg-navy p-7 text-onDark">
              <div aria-hidden="true" className="bg-waves pointer-events-none absolute inset-0" />
              <Icon name="indian-rupee" className="relative h-7 w-7 text-cta" />
              <h2 className="relative mt-3 text-2xl !text-onDark">About cost</h2>
              <p className="relative mt-2 text-onDarkMuted">{siteServices.priceNote}</p>
              <BookButton className="btn-cta relative mt-6 w-full" prefill={{ treatment: c.slug }}>
                Book a consultation
              </BookButton>
            </div>
            <h2 className="pt-2 text-xl">Who treats you</h2>
            {doctors.map((d) => (
              <DoctorMini key={d.id} d={d} />
            ))}
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-surfaceAlt py-16">
        <div className="container-site">
          <h2 className="text-[1.8rem]">You might also be looking for</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <TreatmentCard c={o} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
