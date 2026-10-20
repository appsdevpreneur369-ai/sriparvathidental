import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { DraftBadge } from '@/components/ui/primitives';
import { siteEmergency, sitePages } from '@/lib/content';
import { channels } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';
import { VARS } from '@/lib/vars';

const p = sitePages.emergency;
export const metadata = pageMetadata({ path: '/emergency', title: p.title, description: p.description });

export default function EmergencyPage() {
  const e = siteEmergency;
  return (
    <>
      <PageHeader title={e.title} intro={e.lead} crumbs={[{ name: 'Dental emergency', path: '/emergency' }]} badge={<DraftBadge status={e.status} />}>
        <div className="mt-6 flex flex-wrap gap-3">
          {channels.call && (
            <a href={channels.call.href} className="btn-cta">
              <Icon name="phone" /> Call the clinic: {channels.call.display}
            </a>
          )}
          <a href="tel:108" className="btn-ghost">
            <Icon name="siren" className="h-4 w-4" /> Ambulance: 108
          </a>
        </div>
        <p className="mt-3 text-sm text-textSecondary">Clinic hours: {VARS.hoursSummary}.</p>
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <div role="note" className="mb-10 flex max-w-3xl gap-3 rounded-[1.5rem] border-2 border-warning/40 bg-warningSoft p-5">
            <Icon name="triangle-alert" className="mt-0.5 h-6 w-6 shrink-0 text-warning" />
            <div>
              <h2 className="text-xl">When to go to hospital instead</h2>
              <p className="mt-1">{e.hospitalWarning}</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {e.situations.map((s, i) => (
              <section key={s.title} className="reveal rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft" aria-labelledby={`em-${i}`}>
                <h2 id={`em-${i}`} className="text-xl">
                  {s.title}
                </h2>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-textSecondary marker:font-semibold marker:text-primary">
                  {s.steps.map((st) => (
                    <li key={st}>{st}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
