'use client';
import { useEffect, useState } from 'react';
import { useBooking, type BookingPrefill } from '@/components/booking/BookingProvider';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { writePopupState } from '@/lib/booking/storage';

/**
 * /book: the wizard inline. Deep links (?problem= / ?treatment= / ?doctor=) are read after mount rather than with
 * useSearchParams, so the page stays fully static and the first step is in the HTML (no layout shift).
 */
export function BookPageWizard() {
  const { config } = useBooking();
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = { problem: sp.get('problem') ?? undefined, treatment: sp.get('treatment') ?? undefined, doctor: sp.get('doctor') ?? undefined };
    if (p.problem || p.treatment || p.doctor) setPrefill(p);
  }, []);
  return <BookingWizard key={JSON.stringify(prefill)} config={config} prefill={prefill ?? undefined} onBooked={() => writePopupState('booked')} headingLevel="h2" />;
}
