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
