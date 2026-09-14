'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/layout-primitives';
import { useConsent } from '@/lib/analytics/use-consent';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const TITLE_ID = 'cookie-consent-title';

/**
 * No GA_ID configured -> there is nothing optional to ask about, matching
 * the promise in `lib/content/route-pages.ts` (`cookies` entry): the banner
 * only exists once analytics is actually wired in.
 */
export function CookieConsentBanner({ locale }: { locale: Locale }) {
  const { status, accept, reject } = useConsent();
  // Same check as `whatsapp-button.tsx`: on mobile, product pages have their
  // own fixed bottom bar (`MobilePurchaseBar`, ~69px) — without clearing it,
  // this banner would sit on top of "Add to bag".
  const productPage = /^\/(?:en|es)\/products\/[^/]+\/?$/.test(usePathname());
  if (!GA_ID || status !== 'unknown') return null;

  return (
    <aside
      role="region"
      aria-labelledby={TITLE_ID}
      className={cn(
        'fixed inset-x-0 z-40 border-t border-line bg-ivory/98 py-4 shadow-lift backdrop-blur-sm [padding-bottom:max(1rem,env(safe-area-inset-bottom))]',
        productPage ? 'bottom-[4.5rem] lg:bottom-0' : 'bottom-0',
      )}
    >
      <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id={TITLE_ID} className="text-body-sm text-ink/80">
          {pick(
            locale,
            'We would like to use Google Analytics to understand how you use the site. Nothing is activated until you accept.',
            'Nos gustaría usar Google Analytics para entender cómo usas la web. No activamos nada hasta que lo aceptes.',
          )}{' '}
          <Link
            href={localizedHref(locale, '/cookies')}
            className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
          >
            {pick(locale, 'Cookie policy', 'Política de cookies')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={reject}>
            {pick(locale, 'Decline', 'Rechazar')}
          </Button>
          <Button variant="primary" size="sm" onClick={accept}>
            {pick(locale, 'Accept', 'Aceptar')}
          </Button>
        </div>
      </Container>
    </aside>
  );
}
