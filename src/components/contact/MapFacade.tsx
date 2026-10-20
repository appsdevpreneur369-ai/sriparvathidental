'use client';
import { useState } from 'react';
import { Icon } from '../ui/Icon';

/**
 * Google Map loaded only when the visitor asks for it: keeps Google's scripts and cookies off the page
 * until then (see the Cookie Policy) and keeps the Contact page fast.
 */
export function MapFacade({ src, title, label }: { src: string; title: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-brand border border-border bg-tint shadow-soft lg:aspect-[4/5]">
      {show ? (
        <iframe title={title} src={src} referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
      ) : (
        <button type="button" onClick={() => setShow(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgb(var(--c-mint))_0,transparent_45%),radial-gradient(circle_at_75%_70%,rgb(var(--c-mintSoft))_0,transparent_40%)]" />
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rotate-[-8deg] bg-surface/80" />
          <span aria-hidden="true" className="absolute inset-y-0 left-1/3 w-2.5 rotate-[12deg] bg-surface/70" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-lift transition-transform group-hover:scale-105">
            <Icon name="map-pin" className="h-7 w-7" />
          </span>
          <span className="relative rounded-full bg-surface px-5 py-2.5 font-semibold text-primaryDeep shadow-soft">{label}</span>
          <span className="relative text-sm text-textSecondary">Loads Google Maps</span>
        </button>
      )}
    </div>
  );
}
