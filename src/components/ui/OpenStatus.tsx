'use client';
import { useEffect, useState } from 'react';
import { openStatus, openStatusText, type DayHours } from '@/lib/hours';
import { cn } from '@/lib/cn';

/** "Open now · closes 2:00 PM" in Asia/Kolkata, computed in the browser (so static pages stay correct). */
export function OpenStatus({ hours, timeZone, className }: { hours: DayHours[]; timeZone: string; className?: string }) {
  const [s, setS] = useState<ReturnType<typeof openStatus> | null>(null);
  useEffect(() => {
    const tick = () => setS(openStatus(hours, timeZone));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours, timeZone]);
  return (
    <span className={cn('inline-flex min-h-[28px] items-center gap-2 font-semibold', !s ? 'text-textSecondary' : s.open ? 'text-success' : 'text-warning', className)} aria-live="polite">
      <span className={cn('h-2.5 w-2.5 rounded-full', !s ? 'bg-border' : s.open ? 'bg-success' : 'bg-warning')} aria-hidden="true" />
      {s ? openStatusText(s) : 'Checking hours…'}
    </span>
  );
}
