import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/lib/fonts';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { WhatsAppButton } from '@/components/contact/whatsapp-button';
import { isLocale, locales, pageAlternates, pick, socialMeta } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';
import { jsonLdScript, organizationJsonLd, websiteJsonLd } from '@/lib/structured-data';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const title = pick(lang, 'Dominican Body Care in the USA', 'Cuidado corporal dominicano en EE. UU.');
  const description = pick(
    lang,
    'Shop Dominican body care: stretch mark oils, coconut body scrub, hydrating cream and ingrown hair serum. Shipping within the United States.',
    'Compra cuidado corporal dominicano: aceites para estrías, exfoliante de coco, crema hidratante y sérum post-depilación. Envíos en Estados Unidos.',
  );
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `Gaviota by Lia | ${title}`, template: '%s | Gaviota by Lia' },
    description,
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/images/gaviota/favicon/icon.svg', type: 'image/svg+xml' },
        { url: '/images/gaviota/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      ],
      shortcut: '/favicon.ico',
      apple: '/images/gaviota/favicon/apple-touch-icon.png',
    },
    manifest: '/images/gaviota/favicon/site.webmanifest',
    alternates: pageAlternates(lang, ''),
    ...socialMeta(lang, '', description),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'> & { children: ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const siteUrl = getSiteUrl();

  return (
    // `data-scroll-behavior="smooth"` es necesario en Next 16: por defecto ya
    // NO se anula el `scroll-behavior: smooth` global durante las navegaciones,
    // y sin este atributo cada cambio de ruta hace un scroll animado lentísimo
    // hasta arriba en vez de saltar.
    <html
      lang={lang === 'en' ? 'en-US' : 'es-US'}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-dvh antialiased">
        {/* `jsonLdScript` escapa `<`: sin eso, un valor que contenga
          `</script>` cerraria la etiqueta y lo siguiente se ejecutaria. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd(siteUrl)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd(siteUrl, lang)) }}
        />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xs focus:bg-gold-deep focus:px-4 focus:text-sm focus:font-semibold focus:text-white-warm"
        >
          {pick(lang, 'Skip to content', 'Saltar al contenido')}
        </a>
        <AnnouncementBar locale={lang} />
        <SiteHeader locale={lang} />
        <main id="content">{children}</main>
        <SiteFooter locale={lang} />
        <WhatsAppButton locale={lang} />
      </body>
    </html>
  );
}
