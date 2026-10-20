import Image from 'next/image';
import Link from 'next/link';
import { siteBrand, siteImages } from '@/lib/content';
import { cn } from '@/lib/cn';

/** Logo mark (content/images.json → logo.mark, already on its own teal tile) + serif wordmark. */
export function Logo({ onDark, className, priority }: { onDark?: boolean; className?: string; priority?: boolean }) {
  const m = siteImages.logo.mark;
  return (
    <Link href="/" className={cn('group inline-flex min-h-[44px] shrink-0 items-center gap-3', className)} aria-label={`${siteBrand.wordmark.primary} ${siteBrand.wordmark.secondary} — home`}>
      <Image src={m.src} alt="" width={m.width} height={m.height} priority={priority} sizes="48px" className="h-11 w-11 rounded-[0.9rem] transition-transform duration-300 group-hover:-rotate-6 sm:h-12 sm:w-12" />
      <span className="flex flex-col leading-none">
        <span className={cn('font-heading text-[1.35rem] font-semibold tracking-tight sm:text-[1.5rem]', onDark ? 'text-onDark' : 'text-navy')}>{siteBrand.wordmark.primary}</span>
        <span className={cn('mt-1 text-[0.68rem] font-bold uppercase tracking-[0.28em]', onDark ? 'text-mintOnDark' : 'text-primary')}>{siteBrand.wordmark.secondary}</span>
      </span>
    </Link>
  );
}
