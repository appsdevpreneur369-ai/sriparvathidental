import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { DraftBadge } from '@/components/ui/primitives';
import { getImage, siteGallery, sitePages } from '@/lib/content';
import { galleryJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { GalleryGrid } from './GalleryGrid';

const p = sitePages.gallery;
export const metadata = pageMetadata({ path: '/gallery', title: p.title, description: p.description });

export default function GalleryPage() {
  const items = siteGallery.items.map((g) => ({ ...getImage(g.image), caption: g.caption, category: g.category }));
  // ImageGallery JSON-LD credits the clinic, so it only lists the clinic's OWN photos (stock images carry a credit).
  const own = items.filter((i) => !i.credit);
  return (
    <>
      {own.length > 0 && <JsonLd data={galleryJsonLd('/gallery', own)} />}
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Gallery', path: '/gallery' }]} badge={<DraftBadge status={siteGallery.status} />} />
      <section className="section">
        <div className="container-site">
          {own.length < items.length && (
            <p className="mb-8 flex max-w-3xl gap-3 rounded-2xl border border-cta/50 bg-warningSoft px-5 py-4 text-[0.95rem] text-text">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-warningText" /> {siteGallery.intro}
            </p>
          )}
          <GalleryGrid items={items} categories={siteGallery.categories} />
        </div>
      </section>
    </>
  );
}
