import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BookingProvider } from '@/components/booking/BookingProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Logo } from '@/components/layout/Logo';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { RevealObserver } from '@/components/ui/RevealObserver';
import { bookingClientConfig } from '@/lib/booking/clientConfig';
import { siteBrand, siteClinic, siteNav, sitePages } from '@/lib/content';
import { clinicJsonLd } from '@/lib/jsonld';
import { channels, generalWhatsappHref, portal } from '@/lib/links';
import { NOINDEX, SITE_URL } from '@/lib/site';
import { fontClassNames, themeCss } from '@/lib/theme';
import { fullAddress } from '@/lib/vars';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: sitePages.home.title },
  description: sitePages.home.description,
  applicationName: siteClinic.name.value,
  robots: NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: siteBrand.colors.background,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const booking = bookingClientConfig();
  return (
    <html lang="en-IN" className={fontClassNames}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:font-semibold focus:text-primaryDeep focus:shadow-lift">
          Skip to content
        </a>
        <JsonLd data={clinicJsonLd()} />
        <BookingProvider config={booking}>
          <Header
            logo={<Logo priority />}
            items={siteNav.header}
            signInHref={portal('login')}
            registerHref={portal('register')}
            callHref={channels.call?.href ?? null}
            callDisplay={channels.call?.display ?? null}
            whatsappHref={generalWhatsappHref}
            topLine={fullAddress}
            status={<OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />}
          />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <MobileActionBar callHref={channels.call?.href ?? null} whatsappHref={generalWhatsappHref} />
        </BookingProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
