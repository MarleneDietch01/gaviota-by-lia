import type { Product } from '@/lib/catalog/products';
import { toUnits } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';

/**
 * Datos estructurados de Organización.
 *
 * Ya previsto en `docs/SITEMAP.md` ("nombre legal, logo, contacto, sameAs
 * Instagram"), implementado con el nombre legal real. Datos también citados
 * en `LEGAL_TODO.md` L1 (EIN del IRS + Articles of Organization de Rhode
 * Island).
 */
export function organizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${siteUrl}/#organization`,
    name: 'Gaviota by Lia',
    legalName: 'Gaviota By Lia LLC',
    url: siteUrl,
    logo: `${siteUrl}/images/gaviota/favicon/android-chrome-512x512.png`,
    email: 'gaviotabylia@gmail.com',
    telephone: '+1-401-305-8713',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+1-401-305-8713',
      email: 'gaviotabylia@gmail.com',
      availableLanguage: ['English', 'Spanish'],
      areaServed: 'US',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5 Rangeley Avenue',
      addressLocality: 'Providence',
      addressRegion: 'RI',
      postalCode: '02908',
      addressCountry: 'US',
    },
    sameAs: ['https://www.instagram.com/gaviotabylia/'],
  };
}

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
/**
 * `product.image` es relativo para las fotos estáticas heredadas
 * (`/images/gaviota/...`) pero ya absoluto para cualquier foto subida desde
 * /admin/products (bucket público de Supabase Storage, ver
 * `lib/catalog/products.ts`). Concatenar `siteUrl` a una URL ya absoluta
 * produce una URL rota en los datos estructurados — solo se antepone cuando
 * hace falta.
 */
function toAbsoluteImageUrl(siteUrl: string, image: string): string {
  return new URL(image, siteUrl).href;
}

export function productJsonLd(product: Product, lang: Locale, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/${lang}/products/${product.slug}#product`,
    url: `${siteUrl}/${lang}/products/${product.slug}`,
    name: product.name,
    description: product.shortDescription,
    image: [...new Set([product.image, ...product.images.map((image) => image.src)])]
      .map((image) => toAbsoluteImageUrl(siteUrl, image)),
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Gaviota by Lia' },
    offers: {
      '@type': 'Offer',
      price: toUnits(product.price).toFixed(2),
      priceCurrency: 'USD',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${siteUrl}/#organization` },
      eligibleRegion: { '@type': 'Country', name: 'US' },
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/${lang}/products/${product.slug}`,
    },
  };
}

/**
 * `WebSite` a nivel de sitio, con `SearchAction` apuntando al buscador real.
 * `q` es el parámetro que de verdad lee `src/app/[lang]/search/page.tsx` —
 * verificado antes de escribir esto, no asumido.
 */
export function websiteJsonLd(siteUrl: string, lang: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'Gaviota by Lia',
    url: siteUrl,
    inLanguage: ['en-US', 'es-US'],
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/${lang}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
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

/**
 * Serializa datos estructurados para incrustarlos en un `<script>`.
 *
 * `JSON.stringify` NO escapa `<` ni `/`. Un valor que contenga `</script>`
 * cierra la etiqueta y todo lo que venga detrás lo ejecuta el navegador como
 * código. Hoy estos datos salen del panel de administración, así que haría
 * falta una cuenta con permisos para inyectarlos — pero la CSP declara
 * `script-src 'unsafe-inline'` (ver next.config.ts), así que si llegara a
 * pasar, se ejecutaría sin nada que lo frene.
 *
 * Escapar `<` basta: neutraliza tanto `</script>` como `<!--`, y el JSON
 * resultante sigue siendo válido — `\u003c` se decodifica a `<`.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
