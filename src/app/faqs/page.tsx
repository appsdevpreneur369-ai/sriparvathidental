import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { Accordion, DraftBadge } from '@/components/ui/primitives';
import { siteFaqs, sitePages } from '@/lib/content';
import { faqJsonLd } from '@/lib/jsonld';
import { channels } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';
import { fill } from '@/lib/vars';

const p = sitePages.faqs;
export const metadata = pageMetadata({ path: '/faqs', title: p.title, description: p.description });

export default function FaqsPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(siteFaqs.items)} />
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'FAQs', path: '/faqs' }]} badge={<DraftBadge status={siteFaqs.status} />} />
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="sr-only">Questions and answers</h2>
            <Accordion items={siteFaqs.items.map((f) => ({ q: fill(f.q), a: fill(f.a) }))} />
          </div>
          <aside className="on-dark h-fit rounded-[1.75rem] bg-navy p-7 text-onDark lg:sticky lg:top-32">
            <Icon name="message-circle" className="h-7 w-7 text-cta" />
            <h2 className="mt-3 text-2xl !text-onDark">Still have a question?</h2>
            <p className="mt-2 text-onDarkMuted">Ask when you book, or call the clinic during opening hours.</p>
            <div className="mt-6 grid gap-3">
              <BookButton className="btn-cta w-full">
                <Icon name="calendar-check" /> Book an appointment
              </BookButton>
              {channels.call && (
                <a href={channels.call.href} className="btn-dark-ghost w-full">
                  <Icon name="phone" className="h-4 w-4" /> {channels.call.display}
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
