import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cents } from '@/lib/commerce/money';
import { pageAlternates } from '@/lib/i18n';
import { jsonLdScript, organizationJsonLd, productJsonLd } from '@/lib/structured-data';
import type { Product } from '@/lib/catalog/products';

vi.mock('@/lib/catalog/products', () => ({
  CATEGORIES: [{ slug: 'exfoliacion' }],
  getAllProducts: vi.fn(async (locale: string) => [{
    slug: 'exfoliante-de-coco',
    image: `/images/scrub-${locale}.jpg`,
    images: [
      { src: `/images/scrub-${locale}.jpg` },
      { src: 'https://assets.example.com/scrub.jpg' },
    ],
  }]),
}));

import sitemap from '@/app/sitemap';
import robots from '@/app/robots';

const siteUrl = 'https://www.gaviotabylia.com';

afterEach(() => vi.unstubAllEnvs());

describe('SEO for the bilingual U.S. store', () => {
  it('publishes reciprocal alternates identical to the page metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    const entries = await sitemap();
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);

    for (const entry of entries) {
      const [, locale, ...segments] = new URL(entry.url).pathname.split('/');
      const alternates = pageAlternates(locale as 'en' | 'es', `/${segments.join('/')}`);
      expect(entry.url).toBe(new URL(alternates.canonical, siteUrl).href);
      expect(entry.alternates?.languages).toEqual(Object.fromEntries(
        Object.entries(alternates.languages).map(([language, path]) => [language, new URL(path, siteUrl).href]),
      ));
      for (const url of Object.values(entry.alternates!.languages!)) {
        expect(entries.some((candidate) => candidate.url === url)).toBe(true);
      }
    }
    const home = entries.find((entry) => entry.url === `${siteUrl}/es`)!;
    expect(home.alternates?.languages).toMatchObject({
      'en-US': `${siteUrl}/en`, 'es-US': `${siteUrl}/es`, 'x-default': `${siteUrl}/en`,
    });
  });

  it('includes the photos actually used in each product language without duplicate or malformed URLs', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    const entries = await sitemap();
    for (const locale of ['en', 'es']) {
      expect(entries.find((entry) => entry.url === `${siteUrl}/${locale}/products/exfoliante-de-coco`)?.images)
        .toEqual([`${siteUrl}/images/scrub-${locale}.jpg`, 'https://assets.example.com/scrub.jpg']);
    }
  });

  it('omits placeholders and personal pages while including shopping policies', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    for (const locale of ['en', 'es']) {
      for (const path of ['journal', 'sets', 'cart', 'wishlist', 'account', 'search', 'track-order']) {
        expect(paths).not.toContain(`/${locale}/${path}`);
      }
      expect(paths).toContain(`/${locale}/shipping-policy`);
      expect(paths).toContain(`/${locale}/refund-policy`);
    }
    // Google must be allowed to fetch utility pages to read their noindex.
    expect(robots().rules).toMatchObject({ allow: '/', disallow: ['/admin', '/api/'] });
  });

  it('declares an existing logo and the same seller identity used by product offers', () => {
    const organization = organizationJsonLd(siteUrl);
    expect(existsSync(resolve('public', new URL(organization.logo).pathname.slice(1)))).toBe(true);
    expect(organization.contactPoint.availableLanguage).toEqual(['English', 'Spanish']);
    expect(organization.address.addressCountry).toBe('US');
  });

  it.each([true, false])('keeps product price and availability faithful to the catalog (inStock=%s)', (inStock) => {
    const product: Product = {
      id: 'test-product-id', sizeLabel: '4 fl oz', imageAlt: 'Body oil bottle',
      imageWidth: 1200, imageHeight: 1200, imageBackground: '#ffffff',
      featured: false, reviewCount: 0, categorySlug: 'aceites-y-serums', needSlugs: [],
      stockAvailable: inStock ? 5 : 0, variantId: 'test-variant', translationStale: false,
      slug: 'test-product', name: 'Body oil', shortDescription: 'Hydrating body oil',
      price: cents(4995), inStock, image: '/images/oil.jpg',
      images: [
        { src: '/images/oil.jpg', alt: 'Oil bottle', width: 1200, height: 1200 },
        { src: 'https://assets.example.com/oil.jpg', alt: 'Oil detail', width: 1200, height: 1200 },
      ],
    };
    const data = productJsonLd(product, 'en', siteUrl);
    expect(data.offers.price).toBe('49.95');
    expect(data.offers.priceCurrency).toBe('USD');
    expect(data.offers.availability).toBe(`https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`);
    expect(data.offers.seller['@id']).toBe(organizationJsonLd(siteUrl)['@id']);
    expect(data.image).toEqual([`${siteUrl}/images/oil.jpg`, 'https://assets.example.com/oil.jpg']);
    expect(data).not.toHaveProperty('aggregateRating');
  });

  it('cannot turn catalog text into an executable script', () => {
    const untrusted = { name: '</script><script>alert(1)</script>' };
    const serialized = jsonLdScript(untrusted);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(untrusted);
  });
});
