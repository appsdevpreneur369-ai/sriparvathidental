import { DoctorCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { siteAbout, siteDoctors, sitePages } from '@/lib/content';
import { physicianJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.doctors;
export const metadata = pageMetadata({ path: '/doctors', title: p.title, description: p.description });

export default function DoctorsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Doctors', path: '/doctors' }]} />
      <JsonLd data={siteDoctors.map(physicianJsonLd)} />
      <section className="section">
        <div className="container-site grid gap-8">
          {siteDoctors.map((d) => (
            <DoctorCard key={d.id} d={d} headingLevel="h2" />
          ))}
          <div className="flex items-start gap-4 rounded-[1.75rem] border border-dashed border-primary/40 bg-mintSoft p-6 sm:p-8">
            <Icon name="users" className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div>
              <h2 className="text-xl">{siteAbout.team.title}</h2>
              <p className="mt-1 text-textSecondary">{siteAbout.team.lead}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
