// Plan gating for the website. content/plan.json → features. Pure (unit-tested).
import type { PlanName } from './content/schemas';
import { FEATURE_PLANS, planHas } from './plan-matrix.mjs';

export type PlanFeature = keyof typeof FEATURE_PLANS;

export const hasFeature = (plan: PlanName, feature: PlanFeature): boolean => planHas(plan, feature);

/** Patient-facing benefits of the clinic's plan, shown on About/Book. Never lists anything the plan lacks. */
const PATIENT_BENEFITS: { feature: PlanFeature; text: string }[] = [
  { feature: 'onlineBooking', text: 'Book online at any hour, even when the clinic is closed' },
  { feature: 'emailReminders', text: 'Email confirmation and a reminder before your visit' },
  { feature: 'whatsappReminders', text: 'Appointment reminders on WhatsApp' },
  { feature: 'smsReminders', text: 'Appointment reminders by SMS' },
  { feature: 'liveQueue', text: 'A live queue display at the clinic, so you know when you are next' },
  { feature: 'digitalPrescriptions', text: 'Clear digital prescriptions' },
  { feature: 'waitlist', text: 'Join a waitlist and be told when an earlier slot opens' },
];

export function patientBenefits(plan: PlanName): string[] {
  return PATIENT_BENEFITS.filter((b) => hasFeature(plan, b.feature)).map((b) => b.text);
}
