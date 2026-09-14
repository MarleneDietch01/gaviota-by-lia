'use client';

import Script from 'next/script';
import { useConsent } from '@/lib/analytics/use-consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Nothing here reaches the DOM — no script tag, no cookie — until `status`
 * is 'granted'. That's a stricter reading of Consent Mode than Google's own
 * default (which loads gtag.js unconditionally and lets it send cookieless
 * pings while denied): see the cookie-policy copy this backs
 * (`lib/content/route-pages.ts`, `cookies` entry) — it promises nothing
 * loads before you accept, not "nothing personal loads".
 */
export function GoogleAnalytics() {
  const { status } = useConsent();
  if (!GA_ID || status !== 'granted') return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
          });
          gtag('consent', 'update', { analytics_storage: 'granted' });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
