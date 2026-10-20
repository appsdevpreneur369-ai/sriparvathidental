import { BookButton } from '../booking/BookButton';
import { Icon, WhatsAppIcon } from '../ui/Icon';

/** Floating bottom dock on phones: Book · Call · WhatsApp. Call/WhatsApp are omitted while their numbers are placeholders. */
export function MobileActionBar({ callHref, whatsappHref }: { callHref: string | null; whatsappHref: string | null }) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 md:hidden">
      <div className="flex items-center gap-2 rounded-full border border-onDark/10 bg-navy/95 p-1.5 shadow-lift backdrop-blur">
        <BookButton className="btn-cta !min-h-[48px] flex-1 !px-4 text-[0.95rem] !shadow-none">
          <Icon name="calendar-check" className="h-4 w-4" /> Book a visit
        </BookButton>
        {callHref && (
          <a href={callHref} aria-label="Call the clinic" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-onDark/10 text-onDark hover:bg-onDark/20">
            <Icon name="phone" className="h-5 w-5" />
          </a>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp the clinic" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-whatsapp text-onDark">
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
