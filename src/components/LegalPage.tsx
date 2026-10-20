import { notFound } from 'next/navigation';
import { getLegal, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { PageHeader } from './layout/PageHeader';
import { DraftBadge } from './ui/primitives';

type Key = 'privacy' | 'terms' | 'disclaimer' | 'cookies';

export const legalMetadata = (key: Key) => pageMetadata({ path: `/${key}`, title: sitePages[key].title, description: sitePages[key].description });

export function LegalPage({ slug }: { slug: Key }) {
  const l = getLegal(slug);
  if (!l) notFound();
  return (
    <>
      <PageHeader title={l.meta.title} crumbs={[{ name: l.meta.title, path: `/${slug}` }]} badge={l.meta.draft ? <span className="ml-2 inline-flex rounded-full bg-tint px-3 py-1 align-middle font-body text-sm font-semibold text-primaryHover">Draft</span> : <DraftBadge status={l.meta.status} />}>
        <p className="mt-3 text-sm text-textSecondary">Last updated {new Date(l.meta.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <div className="prose-site" dangerouslySetInnerHTML={{ __html: l.html }} />
        </div>
      </section>
    </>
  );
}
