import type { MetadataRoute } from 'next';
import { CATEGORIES, getAllProducts } from '@/lib/catalog/products';
import { locales, type Locale } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Static content routes to include, sourced from `route-pages.ts`'s key set
 * rather than hardcoded twice. Deliberately a subset, not every key there:
 * legal/policy pages (`terms`, `cookies`, `privacy-policy`, `refund-policy`,
 * `shipping-policy`) and `track-order` are real pages but weren't part of the
 * requested sitemap scope — add them here if they should be indexed too.
 */
const STATIC_PATHS = [
  '/shop',
  '/sets',
  '/rituals',
  '/our-story',
  '/founder',
  '/ingredients',
  '/journal',
  '/contact',
  '/faq',
];

/**
 * One `<url>` entry per locale for a given path — a Spanish visitor and an
 * English visitor land on two different URLs for the "same" page, so each
 * needs its own sitemap entry, not one entry with the other locale merely
 * listed as an alternate. Each entry still declares `alternates.languages`
 * pointing at every locale (itself included), same as the page's own
 * hreflang tags.
 */
function localizedEntries(siteUrl: string, path: string): MetadataRoute.Sitemap {
  const urlFor = (locale: Locale) => `${siteUrl}/${locale}${path === '/' ? '' : path}`;
  const languages = Object.fromEntries(locales.map((locale) => [locale, urlFor(locale)]));

  return locales.map((locale) => ({
    url: urlFor(locale),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getAllProducts();

  const homeAndStatic = ['/', ...STATIC_PATHS].flatMap((path) => localizedEntries(siteUrl, path));
  const categories = CATEGORIES.flatMap((category) => localizedEntries(siteUrl, `/categories/${category.slug}`));
  const productPages = products.flatMap((product) => localizedEntries(siteUrl, `/products/${product.slug}`));

  return [...homeAndStatic, ...categories, ...productPages];
}
