import type { MetadataRoute } from 'next';
import { CATEGORIES, getAllProducts } from '@/lib/catalog/products';
import { locales, pageAlternates } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Only published, indexable pages. Journal and sets are placeholders with
 * noindex until their content is ready. Policies help shoppers evaluate the
 * store. No invented lastModified: deployments aren't content updates.
 */
const STATIC_PATHS = [
  '/shop',
  '/rituals',
  '/our-story',
  '/founder',
  '/ingredients',
  '/contact',
  '/faq',
  '/shipping-policy',
  '/refund-policy',
  '/privacy-policy',
  '/terms',
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
  return locales.map((locale) => {
    const { canonical, languages } = pageAlternates(locale, path);
    return {
      url: new URL(canonical, siteUrl).href,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languages).map(([language, url]) => [language, new URL(url, siteUrl).href]),
        ),
      },
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const localizedProducts = await Promise.all(locales.map((locale) => getAllProducts(locale)));

  const homeAndStatic = ['/', ...STATIC_PATHS].flatMap((path) => localizedEntries(siteUrl, path));
  const categories = CATEGORIES.flatMap((category) => localizedEntries(siteUrl, `/categories/${category.slug}`));
  const productPages = localizedProducts.flatMap((products, index) =>
    products.map((product) => ({
      ...localizedEntries(siteUrl, `/products/${product.slug}`)[index]!,
      images: [...new Set([product.image, ...product.images.map((image) => image.src)])]
        .map((image) => new URL(image, siteUrl).href),
    })),
  );

  return [...homeAndStatic, ...categories, ...productPages];
}
