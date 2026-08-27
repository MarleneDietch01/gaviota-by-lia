import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/lib/fonts';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { isLocale, locales, pageAlternates, pick, socialMeta } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';
import { organizationJsonLd, websiteJsonLd } from '@/lib/structured-data';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const title = pick(lang, 'Dominican Body Care', 'Cuidado corporal dominicano');
  const description = pick(
    lang,
    'Dominican-inspired body care rituals made to hydrate, soften, and celebrate your skin.',
    'Rituales de cuidado corporal creados para hidratar, suavizar y celebrar tu piel.',
  );
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `Gaviota by Lia | ${title}`, template: '%s | Gaviota by Lia' },
    description,
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
      lang={lang === 'en' ? 'en-US' : 'es'}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-dvh antialiased">
        {/* JSON estático generado en servidor, sin datos de usuario — no hay
            riesgo de inyección al usar dangerouslySetInnerHTML aquí. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(siteUrl)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(siteUrl, lang)) }}
        />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xs focus:bg-rose focus:px-4 focus:text-sm focus:font-semibold focus:text-white-warm"
        >
          {pick(lang, 'Skip to content', 'Saltar al contenido')}
        </a>
        <AnnouncementBar locale={lang} />
        <SiteHeader locale={lang} />
        <main id="content">{children}</main>
        <SiteFooter locale={lang} />
      </body>
    </html>
  );
}
