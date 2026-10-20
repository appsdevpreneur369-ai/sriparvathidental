'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';

type Item = { src: string; width: number; height: number; alt: string; caption: string; category: string; objectPosition?: string };

/** Filterable masonry photo grid. Filters are real buttons with aria-pressed; all photos render server-side. */
export function GalleryGrid({ items, categories }: { items: Item[]; categories: string[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? items.filter((i) => i.category === cat) : items;
  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter photos">
        {[null, ...categories].map((c) => (
          <button key={c ?? 'all'} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn('chip', cat === c && '!border-navy !bg-navy !text-onDark')}>
            {c ?? 'All'}
          </button>
        ))}
      </div>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {shown.map((i) => (
          <li key={i.src} className="group mb-4 break-inside-avoid">
            <figure className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-soft">
              <div className="overflow-hidden">
                <Image src={i.src} alt={i.alt} width={i.width} height={i.height} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: i.objectPosition ?? '50% 35%' }} />
              </div>
              <figcaption className="px-4 py-3 text-sm font-medium text-text">{i.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </>
  );
}
