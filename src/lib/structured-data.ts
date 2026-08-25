import type { Product } from '@/lib/catalog/products';
import { toUnits } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';

/**
 * `Product` JSON-LD for one product page.
 *
 * `availability` is derived from `product.inStock`, which is `stock_quantity -
 * reserved_quantity > 0` on the product's primary variant (from
 * `product_variants` in Supabase, admin-editable via `/admin/products`).
 * Now that checkout also rejects an out-of-stock line (see
 * `src/lib/commerce/checkout.ts`), reporting InStock unconditionally would be
 * actively misleading — a shopper could land here from Google, click through,
 * and be turned away at checkout.
 *
 * No `aggregateRating`/`review` — there are no real reviews yet, and a
 * fabricated rating in structured data risks a manual Google penalty.
 */
export function productJsonLd(product: Product, lang: Locale, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: `${siteUrl}${product.image}`,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Gaviota by Lia' },
    offers: {
      '@type': 'Offer',
      price: toUnits(product.price).toFixed(2),
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/${lang}/products/${product.slug}`,
    },
  };
}

export interface BreadcrumbEntry {
  readonly name: string;
  readonly url: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
