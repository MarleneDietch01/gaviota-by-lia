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

function localizedEntry(
  siteUrl: string,
  path: string,
): MetadataRoute.Sitemap[number] {
  const withLocale = (locale: Locale) => `${siteUrl}/${locale}${path === '/' ? '' : path}`;
  return {
    url: withLocale('en'),
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, withLocale(locale)])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getAllProducts();

  const homeAndStatic = ['/', ...STATIC_PATHS].map((path) => localizedEntry(siteUrl, path));
  const categories = CATEGORIES.map((category) => localizedEntry(siteUrl, `/categories/${category.slug}`));
  const productPages = products.map((product) => localizedEntry(siteUrl, `/products/${product.slug}`));

  return [...homeAndStatic, ...categories, ...productPages];
}
