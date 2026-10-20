'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Subtle scroll-reveal for elements with class "reveal". Content is visible by default (no JS, crawlers,
 * reduced motion); only after this runs does <html> get "js-reveal", which hides not-yet-seen elements.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    // Anything already on screen is shown immediately so nothing flashes.
    const vh = window.innerHeight;
    els.forEach((el) => el.getBoundingClientRect().top < vh && el.classList.add('is-visible'));
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    els.forEach((el) => !el.classList.contains('is-visible') && io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
