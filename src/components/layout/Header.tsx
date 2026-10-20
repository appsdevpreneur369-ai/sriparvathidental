'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { BookButton } from '../booking/BookButton';
import { Icon, WhatsAppIcon } from '../ui/Icon';

type Item = { label: string; href: string };

/**
 * Mint info strip (open-now status, address, phone, sign-in) + a floating, rounded glass header that docks to the
 * top on scroll. Active page = mint pill. Below xl the navigation moves into a full-height sheet.
 */
export function Header({
  logo, items, signInHref, registerHref, callHref, callDisplay, whatsappHref, topLine, status,
}: {
  logo: ReactNode; items: Item[]; signInHref: string; registerHref: string; callHref: string | null; callDisplay: string | null; whatsappHref: string | null; topLine: string; status: ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menu]);

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="hidden border-b border-border bg-mintSoft text-[0.84rem] text-text md:block">
        <div className="container-site flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <span className="shrink-0 text-[0.84rem]">{status}</span>
            <p className="hidden min-w-0 items-center gap-1.5 truncate text-textSecondary lg:flex">
              <Icon name="map-pin" className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{topLine}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {callHref && (
              <a href={callHref} className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap font-semibold text-primaryDeep hover:underline">
                <Icon name="phone" className="h-4 w-4" /> {callDisplay}
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap font-semibold text-primaryDeep hover:underline">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <a href={signInHref} className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap border-l border-primary/20 pl-4 font-semibold text-primaryDeep hover:underline">
              <Icon name="log-in" className="h-4 w-4" /> Patient sign in
            </a>
          </div>
        </div>
      </div>
      <header className={cn('sticky top-0 z-50 transition-[padding] duration-300 xl:px-4', scrolled ? 'xl:pt-2' : 'xl:pt-4')}>
        <div
          className={cn(
            'glass mx-auto flex max-w-site items-center justify-between gap-4 border-b border-border px-4 transition-all duration-300 sm:px-6 xl:rounded-[1.4rem] xl:border xl:px-5',
            scrolled || menu ? 'py-2 shadow-lift' : 'py-3 shadow-soft xl:shadow-none',
          )}
        >
          {logo}
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} aria-current={active(it.href) ? 'page' : undefined} className="nav-link">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {callHref && (
              <a href={callHref} aria-label={`Call ${callDisplay}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tint text-primary hover:bg-mintSoft md:hidden">
                <Icon name="phone" className="h-5 w-5" />
              </a>
            )}
            <BookButton className="btn-cta hidden whitespace-nowrap !min-h-[46px] !px-5 !text-[0.92rem] sm:inline-flex">
              <Icon name="calendar-check" className="h-4 w-4" /> Book Appointment
            </BookButton>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy text-onDark hover:bg-navySoft xl:hidden"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label={menu ? 'Close menu' : 'Open menu'}
              onClick={() => setMenu((m) => !m)}
            >
              <Icon name={menu ? 'x' : 'menu'} className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav id="mobile-menu" aria-label="Mobile" hidden={!menu} className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto bg-background xl:hidden">
          <ul className="container-site grid gap-1 py-5">
            {items.map((it, i) => (
              <li key={it.href} className="animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                <Link href={it.href} aria-current={active(it.href) ? 'page' : undefined} className="mobile-nav-link">
                  {it.label} <Icon name="arrow-up-right" className="h-5 w-5 text-primary" />
                </Link>
              </li>
            ))}
            <li className="mt-4">
              <BookButton className="btn-cta w-full">
                <Icon name="calendar-check" className="h-4 w-4" /> Book Appointment
              </BookButton>
            </li>
            <li className="grid grid-cols-2 gap-2">
              <a href={signInHref} className="btn-ghost !px-3">
                <Icon name="log-in" className="h-4 w-4" /> Sign in
              </a>
              <a href={registerHref} className="btn-ghost !px-3">
                <Icon name="user-plus" className="h-4 w-4" /> Register
              </a>
            </li>
            {callHref && (
              <li>
                <a href={callHref} className="btn-primary w-full">
                  <Icon name="phone" className="h-4 w-4" /> Call {callDisplay}
                </a>
              </li>
            )}
            {whatsappHref && (
              <li>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full">
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp the clinic
                </a>
              </li>
            )}
            <li className="mt-3 rounded-2xl bg-mintSoft p-4 text-sm">{status}</li>
          </ul>
        </nav>
      </header>
    </>
  );
}
