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
