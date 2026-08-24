export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('/api/')) return href;
  return `/${locale}${href === '/' ? '' : href}`;
}

export function pick(locale: Locale, en: string, es: string): string {
  return locale === 'es' ? es : en;
}

/**
 * `alternates` (canonical + hreflang) for one route, self-referencing.
 *
 * Next.js metadata does NOT deep-merge `alternates` between a layout and its
 * page: whatever the page sets replaces the layout's object entirely, and
 * whatever it leaves unset is inherited whole. That's what caused every
 * non-home route to either inherit the home's canonical/hreflang verbatim
 * (when the page set no `alternates` at all, e.g. product pages) or keep a
 * self-referencing canonical but lose hreflang entirely (when the page set
 * only `{ canonical }`, e.g. category pages). Every `generateMetadata` that
 * sets `alternates` must go through this helper so canonical and hreflang
 * always describe the same URL.
 *
 * `path` is locale-less and starts with `/` (or is `''`/`'/'` for home).
 */
export function pageAlternates(lang: Locale, path: string) {
  const suffix = path === '/' ? '' : path;
  return {
    canonical: `/${lang}${suffix}`,
    languages: {
      'en-US': `/en${suffix}`,
      es: `/es${suffix}`,
      'x-default': `/en${suffix}`,
    },
  };
}

export interface SocialImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

/** Brand family shot, cropped to the 1200x630 Open Graph aspect ratio. Used
 *  on every page that doesn't have a more specific image of its own (a
 *  product's studio photo, for example). */
export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
  url: '/images/gaviota/og/default.jpg',
  width: 1200,
  height: 630,
  alt: 'Gaviota by Lia body care collection: stretch mark oil, coconut scrub, hydrating cream and ingrown hair serum',
};

/**
 * `openGraph`/`twitter` for one route, self-referencing — the `openGraph`
 * sibling to `pageAlternates()`, needed for the exact same reason: Next.js
 * does NOT deep-merge `openGraph` between a layout and its page, so a page
 * that sets `openGraph` at all replaces the layout's object entirely (losing
 * `siteName`/`locale`), while a page that sets none inherits the parent's
 * `url` verbatim — every visible route calls this so `og:url` always matches
 * that page's own canonical URL, not the home's.
 */
export function socialMeta(lang: Locale, path: string, description: string, image: SocialImage = DEFAULT_SOCIAL_IMAGE) {
  const suffix = path === '/' ? '' : path;
  const url = `/${lang}${suffix}`;
  const images = [{ url: image.url, width: image.width, height: image.height, alt: image.alt }];

  return {
    openGraph: {
      type: 'website' as const,
      locale: lang === 'en' ? 'en_US' : 'es_DO',
      siteName: 'Gaviota by Lia',
      description,
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image' as const,
      description,
      images,
    },
  };
}
