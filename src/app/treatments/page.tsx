import { BookButton } from '@/components/booking/BookButton';
import { TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { categories, sitePages, siteRouting, siteServices } from '@/lib/content';
import { cn } from '@/lib/cn';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.treatments;
export const metadata = pageMetadata({ path: '/treatments', title: p.title, description: p.description });

// Bento: content 'size' decides the footprint (lg = wide feature tile).
const SPAN: Record<string, string> = { lg: 'md:col-span-2', md: '', sm: '' };

export default function TreatmentsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Treatments', path: '/treatments' }]}>
        <ul className="mt-7 flex flex-wrap gap-2" aria-label="Common reasons to visit">
          {siteRouting.problems.slice(0, 5).map((pr) => (
            <li key={pr.id}>
              <BookButton prefill={{ problem: pr.id }} className="chip">
                <Icon name={pr.icon} className="h-4 w-4 text-primary" /> {pr.label}
              </BookButton>
            </li>
          ))}
        </ul>
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <li key={c.slug} className={cn(SPAN[c.size])}>
                <TreatmentCard c={c} headingLevel="h2" priority={i < 2} layout={c.size === 'lg' ? 'feature' : 'stack'} className="h-full" />
              </li>
            ))}
          </ul>
          <p className="mt-10 flex max-w-2xl gap-3 rounded-2xl bg-mintSoft px-5 py-4 text-text">
            <Icon name="indian-rupee" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {siteServices.priceNote}
          </p>
        </div>
      </section>
    </>
  );
}
