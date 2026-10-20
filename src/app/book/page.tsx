import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { siteClinic, sitePages, sitePlan } from '@/lib/content';
import { channels, portal } from '@/lib/links';
import { patientBenefits } from '@/lib/plan';
import { pageMetadata } from '@/lib/seo';
import { BookPageWizard } from './BookPageWizard';

const p = sitePages.book;
export const metadata = pageMetadata({ path: '/book', title: p.title, description: p.description });

export default function BookPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Book', path: '/book' }]} />
      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-lift sm:p-8">
            <BookPageWizard />
          </div>
          <aside className="space-y-5">
            <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft">
              <h2 className="text-xl">Clinic hours</h2>
              <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} className="mt-2" />
              {channels.call && (
                <p className="mt-4 text-[0.95rem] text-textSecondary">
                  Prefer to talk?{' '}
                  <a href={channels.call.href} className="inline-flex min-h-[44px] items-center font-semibold text-primary underline">
                    Call {channels.call.display}
                  </a>
                </p>
              )}
            </div>
            <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft">
              <h2 className="text-xl">After you book</h2>
              <ul className="mt-3 space-y-2 text-[0.95rem]">
                {patientBenefits(sitePlan).map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft">
              <h2 className="text-xl">Already a patient?</h2>
              <p className="mt-1 text-[0.95rem] text-textSecondary">See or manage your appointments on the clinic&apos;s ClinicFlow247 page.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={portal('login')} className="btn-ghost !min-h-[44px] !px-4 text-sm">
                  <Icon name="log-in" className="h-4 w-4" /> Sign in
                </a>
                <a href={portal('register')} className="btn-ghost !min-h-[44px] !px-4 text-sm">
                  <Icon name="user-plus" className="h-4 w-4" /> Register
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
