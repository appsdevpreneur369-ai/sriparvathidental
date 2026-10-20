'use client';
import { useEffect, useState } from 'react';
import { todayHoursText, type DayHours } from '@/lib/hours';

/**
 * Hero chip, computed in the visitor's browser for "today" in the clinic's time zone (static pages stay correct):
 * "Open today 9:30 AM – 9:30 PM" or "Closed today · Opens Monday 9:30 AM".
 * `fallback` (rendered on the server from the same formatter) shows until the browser has computed it.
 */
export function HeroHoursChip({ hours, timeZone, fallback }: { hours: DayHours[]; timeZone: string; fallback: string }) {
  const [text, setText] = useState(fallback);
  useEffect(() => setText(todayHoursText(hours, timeZone)), [hours, timeZone]);
  return <span className="block">{text}</span>;
}
