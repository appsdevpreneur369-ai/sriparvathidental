// Test-only fixtures built straight from /content (no server-only modules).
import fs from 'node:fs';
import path from 'node:path';
import type { BookingClientConfig } from '@/lib/booking/config';
import { buildTreatmentGroups } from '@/lib/booking/treatments';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', f), 'utf8'));
export const content = {
  booking: read('booking.json'),
  doctors: read('doctors.json').doctors as { id: string; slug: string; firstName: string; lastName: string; displayName: string; specialty: string; initials: string; consultation: never[] }[],
  services: read('services.json'),
  routing: read('routing.json'),
  portal: read('portal.json'),
  clinic: read('clinic.json'),
};

const idToSlug = new Map(content.doctors.map((d) => [d.id, d.slug]));
const slugs = (ids: string[]) => ids.map((id) => idToSlug.get(id)!);

export function treatmentGroups() {
  const b = content.booking;
  return buildTreatmentGroups({
    generalGroupLabel: 'Common problems',
    generalOption: { label: b.generalOption.label, doctors: slugs(b.generalOption.doctors) },
    problems: content.routing.problems.map((p: { id: string; label: string; doctors: string[] }) => ({ id: p.id, label: p.label, doctors: slugs(p.doctors) })),
    categories: content.services.categories.map((c: { slug: string; title: string; doctors: string[]; subTreatments: { slug: string; title: string; doctors?: string[] }[] }) => ({
      slug: c.slug,
      title: c.title,
      doctors: slugs(c.doctors),
      subTreatments: c.subTreatments.map((s) => ({ slug: s.slug, title: s.title, doctors: s.doctors ? slugs(s.doctors) : undefined })),
    })),
    allowDirectSpecialistBooking: b.allowDirectSpecialistBooking,
    defaultDoctor: idToSlug.get(b.defaultDoctor)!,
  });
}

export function bookingConfig(over: { baseUrl?: string; clinicSlug?: string; whatsappDigits?: string | null; mode?: BookingClientConfig['preferredMode'] } = {}): BookingClientConfig {
  return {
    preferredMode: over.mode ?? 'clinicflow',
    api: { baseUrl: over.baseUrl ?? '', clinicSlug: over.clinicSlug ?? '', clinicId: '' },
    proxyBase: '/api/clinicflow',
    advanceDays: 30,
    slotMinutes: 20,
    otpResendSeconds: 30,
    timezone: 'Asia/Kolkata',
    treatments: treatmentGroups(),
    problems: [],
    doctors: content.doctors.map((d) => ({ ...d, clinicflowDoctorId: null })),
    clinic: {
      name: 'Sri Parvathi Dental Clinic',
      shortName: 'Sri Parvathi Dental',
      branchName: 'Sri Parvathi Dental — Tadepalli',
      address: 'First Floor, Perreddy Complex, Pathur Road Cross, Tadepalle',
      whatsappDigits: over.whatsappDigits === undefined ? '918954656789' : over.whatsappDigits,
      phoneDisplay: null,
      telHref: null,
    },
    popup: content.booking.popup,
    consentText: 'ok',
    privacyHref: '/privacy',
    whatsappTemplate: content.booking.whatsappMessage,
    enquiryTemplate: content.booking.enquiryMessage,
    note: '',
    otpHint: '',
    portal: { login: '', register: '', bookingPage: '' },
  };
}
