import type { Product } from '@/lib/catalog/products';
import { toUnits } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';

/**
 * `Product` JSON-LD for one product page.
 *
 * `availability` is hardcoded to InStock for every product, not derived from
 * `product_variants.stock_quantity` in Supabase: checkout doesn't enforce or
 * decrement inventory today (see `src/lib/commerce/checkout.ts`), and the
 * `stock_quantity` values currently in the database are seed/test numbers,
 * not a real count — reporting those to Google as this product's live stock
 * would be a worse kind of wrong than a fixed value. InStock reflects the
 * site's actual behavior: nothing is blocked from purchase today. Revisit
 * once the store has real inventory tracking.
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
      availability: 'https://schema.org/InStock',
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
