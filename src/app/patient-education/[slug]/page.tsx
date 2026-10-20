import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { DraftBadge } from '@/components/ui/primitives';
import { articles, getArticle, getDoctorById, getImage } from '@/lib/content';
import { articleJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => articles.map((a) => ({ slug: a.meta.slug }));

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) return {};
  return pageMetadata({ path: `/patient-education/${a.meta.slug}`, title: a.meta.title, description: a.meta.description, type: 'article', image: getImage(a.meta.image).src });
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const m = a.meta;
  const path = `/patient-education/${m.slug}`;
  const img = getImage(m.image);
  const reviewer = getDoctorById(m.reviewedBy);
  const more = articles.filter((x) => x.meta.slug !== m.slug);
  return (
    <>
      <JsonLd data={articleJsonLd({ path, title: m.title, description: m.description, datePublished: m.datePublished, image: m.image, reviewer, wordCount: a.words })} />
      <PageHeader title={m.title} intro={m.description} crumbs={[{ name: 'Patient education', path: '/patient-education' }, { name: m.title, path }]} badge={<DraftBadge status={m.status} />}>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-textSecondary">
          <span>{m.category}</span>
          <span>{m.readingMinutes} min read</span>
          <time dateTime={m.datePublished}>{new Date(m.datePublished).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          {reviewer && <span>{m.reviewStatus === 'reviewed' ? `Reviewed by ${reviewer.displayName}` : `Review by ${reviewer.displayName} pending`}</span>}
        </p>
      </PageHeader>
      <article className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_18rem]">
          <div>
            <Image src={img.src} alt={img.alt} width={img.width} height={img.height} priority sizes="(min-width:1024px) 50rem, 100vw" className="mb-10 w-full max-w-prose rounded-[1.75rem] shadow-soft" />
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: a.html }} />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
            {a.headings.length > 2 && (
              <nav aria-label="On this page" className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-soft">
                <p className="font-semibold">On this page</p>
                <ul className="mt-3 space-y-2 border-l-2 border-mint pl-4 text-[0.95rem] text-textSecondary">
                  {a.headings.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="on-dark rounded-[1.5rem] bg-navy p-6 text-onDark">
              <p className="font-heading text-xl text-onDark">Something bothering you?</p>
              <p className="mt-1 text-[0.95rem] text-onDarkMuted">A check-up is the quickest way to know what is going on.</p>
              <BookButton className="btn-cta mt-5 w-full">Book a check-up</BookButton>
            </div>
          </aside>
        </div>
      </article>
      <section className="border-t border-border bg-surfaceAlt py-14">
        <div className="container-site">
          <h2 className="text-2xl">More guides</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((x) => (
              <li key={x.meta.slug}>
                <Link href={`/patient-education/${x.meta.slug}`} className="flex min-h-[56px] items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 font-semibold text-primaryDeep hover:border-primary">
                  {x.meta.title} <Icon name="chevron-right" className="h-4 w-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
