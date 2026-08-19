import 'server-only';
import type { Cents } from '@/lib/commerce/money';
import { cents } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';
import { filterCatalogProducts } from '@/lib/catalog/query';

/**
 * Catálogo.
 *
 * -----------------------------------------------------------------------------
 * ESTADO: leyendo de datos verificados en la auditoría.
 *
 * La lectura real de Supabase se conecta en cuanto exista el proyecto. La firma
 * de las funciones no cambiará.
 *
 * PROCEDENCIA DE CADA DATO — nada aquí está inventado:
 *   · nombres y precios     -> /products.json del sitio Shopify actual
 *   · tamaños (115/236/59 mL) -> lectura directa de las etiquetas en GA9.jpg
 *   · shortDescription      -> claims IMPRESOS EN EL ENVASE, que son cosméticos
 *                              y están mejor redactados que la web actual
 *
 * DELIBERADAMENTE AUSENTES, porque no existe el dato:
 *   · compareAtPrice  -> los 8 productos del sitio actual tienen descuento
 *                        permanente sin vigencia. No se replica.
 *   · rating / reviewCount -> el sitio actual no tiene NI UNA reseña.
 *   · ingredientes, precauciones, peso -> pendientes (CONTENT_TODO.md C1, C2, C7)
 * -----------------------------------------------------------------------------
 */

export interface Product {
  readonly slug: string;
  readonly name: string;
  readonly shortDescription: string;
  readonly price: Cents;
  readonly sizeLabel: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  /**
   * Color del ciclorama sobre el que se fotografió el envase.
   *
   * La tarjeta pinta su tile con este color exacto para que el borde del JPEG
   * sea invisible y el producto quede sobre un campo continuo. Sin esto, un
   * rectángulo rosa flota dentro de un tile de otro tono y se lee como imagen
   * rota — que es lo que ocurría antes.
   *
   * Valor generado por `scripts/process-images.mjs`; ver la clave
   * `product.<slug>.background` de `public/images/gaviota/image-manifest.json`.
   * Si se regeneran los recortes, hay que copiar el valor nuevo aquí.
   */
  readonly imageBackground: string;
  readonly featured: boolean;
  /** Se muestran estrellas solo si es > 0. Hoy siempre es 0. */
  readonly reviewCount: number;
  /**
   * `false` cuando la ficha tiene menos información que el resto del catálogo
   * (ver `CONTENT_TODO.md` C15 para el Tónico, L2 para el Sunscreen) — nunca se
   * inventa contenido para igualarla, pero la tarjeta sí avisa de que hay menos
   * detalle, en vez de dejar que se vea simplemente "más pobre" sin explicación.
   * Por defecto `true`: la mayoría del catálogo está completo.
   */
  readonly contentComplete?: boolean;
  /** Taxonomía verificada/propuesta en PRODUCT_INVENTORY.md §6. */
  readonly categorySlug: CategorySlug;
  readonly needSlugs: readonly NeedSlug[];
}

export const CATEGORIES = [
  { slug: 'aceites-y-serums', en: 'Oils & serums', es: 'Aceites y sérums' },
  { slug: 'cremas-e-hidratacion', en: 'Creams & hydration', es: 'Cremas e hidratación' },
  { slug: 'exfoliacion', en: 'Exfoliation', es: 'Exfoliación' },
  { slug: 'cuidado-masculino', en: "Men's care", es: 'Cuidado masculino' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
export type NeedSlug = 'hidratacion' | 'textura' | 'estrias' | 'post-depilacion';
export type CatalogSort = 'featured' | 'price-asc' | 'price-desc';

export interface CatalogQuery {
  readonly q?: string;
  readonly category?: CategorySlug;
  readonly sort?: CatalogSort;
}

const CATALOG: readonly Product[] = [
  {
    slug: 'aceite-anti-estrias',
    name: 'Aceite Anti-Estrías',
    shortDescription: 'Reafirmante, hidratante y aporta brillo.',
    price: cents(5000),
    sizeLabel: '115 mL',
    image: '/images/gaviota/products/aceite-anti-estrias-studio.jpg',
    imageAlt: 'Frasco con gotero del Aceite Anti-Estrías Gaviota by Lia de 115 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    categorySlug: 'aceites-y-serums',
    needSlugs: ['hidratacion', 'estrias'],
  },
  {
    slug: 'exfoliante-de-coco',
    name: 'Exfoliante de Coco',
    shortDescription: 'Exfoliación suave con aroma a coco.',
    price: cents(4000),
    sizeLabel: '236 mL',
    image: '/images/gaviota/products/exfoliante-de-coco-studio.jpg',
    imageAlt: 'Tarro del Exfoliante de Coco Gaviota by Lia de 236 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    categorySlug: 'exfoliacion',
    needSlugs: ['textura'],
  },
  {
    slug: 'crema-hidratante',
    name: 'Crema Hidratante',
    shortDescription: 'Hidratación profunda de rápida absorción.',
    price: cents(4000),
    sizeLabel: '236 mL',
    image: '/images/gaviota/products/crema-hidratante-studio.jpg',
    imageAlt: 'Tarro de la Crema Hidratante Gaviota by Lia de 236 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    categorySlug: 'cremas-e-hidratacion',
    needSlugs: ['hidratacion'],
  },
  {
    slug: 'serum-vellos-encarnados',
    name: 'Sérum Vellos Encarnados',
    shortDescription: 'Cuidado de la piel después de la depilación.',
    price: cents(4000),
    sizeLabel: '59 mL',
    image: '/images/gaviota/products/serum-vellos-encarnados-studio.jpg',
    imageAlt: 'Frasco del Sérum Vellos Encarnados Gaviota by Lia de 59 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    categorySlug: 'aceites-y-serums',
    needSlugs: ['post-depilacion'],
  },
  {
    slug: 'aceite-anti-estrias-masculino',
    name: 'Aceite Anti-Estrías Masculino',
    shortDescription: 'Reafirmante, hidratante y aporta brillo.',
    price: cents(5000),
    sizeLabel: '115 mL',
    image: '/images/gaviota/products/aceite-anti-estrias-masculino-studio.jpg',
    imageAlt: 'Frasco con gotero del Aceite Anti-Estrías Masculino Gaviota by Lia de 115 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    categorySlug: 'cuidado-masculino',
    needSlugs: ['hidratacion', 'estrias'],
  },
  {
    slug: 'tonico-para-barba',
    name: 'Tónico Para Barba',
    // Del propio envase: "USO DIARIO". No se reproducen los tres claims que
    // lleva impresos la caja (rellenar vacíos, acelerar el crecimiento,
    // combatir las canas): son claims de crecimiento capilar, categoría de
    // medicamento, pendientes de reescritura (CONTENT_TODO C15).
    shortDescription: 'Tónico para barba, de uso diario.',
    price: cents(4000),
    sizeLabel: '115 mL',
    image: '/images/gaviota/products/tonico-para-barba-studio.jpg',
    imageAlt: 'Tónico Para Barba Gaviota by Lia junto a su estuche',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#e8e2da',
    featured: true,
    reviewCount: 0,
    contentComplete: false,
    categorySlug: 'cuidado-masculino',
    needSlugs: [],
  },
  {
    slug: 'sunscreen',
    name: 'Sunscreen',
    // Único claim impreso en el envase: "HIDRATANTE / MOISTURIZING".
    // NO se reproduce ninguna afirmación de protección solar: en EE. UU. eso
    // convierte el producto en medicamento OTC y la documentación del
    // fabricante sigue pendiente (LEGAL_TODO L2).
    shortDescription: 'Fórmula hidratante de uso diario.',
    price: cents(3000),
    sizeLabel: '59 mL',
    image: '/images/gaviota/products/sunscreen-studio.jpg',
    imageAlt: 'Frasco con dosificador de Sunscreen Gaviota by Lia de 59 mL',
    imageWidth: 1200,
    imageHeight: 1200,
    imageBackground: '#ffffff',
    featured: true,
    reviewCount: 0,
    contentComplete: false,
    categorySlug: 'cremas-e-hidratacion',
    needSlugs: ['hidratacion'],
  },
];

// SIGUEN FUERA, por falta de dato, no de decisión:
//   · Crema Anti-Estrías -> hay packshot (recortado de GA9) pero no existe
//     precio en ninguna parte: nunca se vendió online. Falta precio y descripción.
//   · Producto labial    -> ni packshot ni precio ni nombre confirmado.
//   · Kit                -> su única fotografía lleva "KIT ANTI-ESTRÍAS Y
//     ACLARACIÓN" quemado en la imagen, y "aclaración" es justamente el término
//     regulado que se decidió retirar del nombre comercial.

const ENGLISH: Record<string, Pick<Product, 'name' | 'shortDescription' | 'imageAlt'>> = {
  'aceite-anti-estrias': { name: 'Stretch Mark Body Oil', shortDescription: 'Firming hydration for soft, luminous-looking skin.', imageAlt: '4 fl oz Gaviota by Lia Stretch Mark Body Oil dropper bottle' },
  'exfoliante-de-coco': { name: 'Coconut Body Scrub', shortDescription: 'Gentle exfoliation with a tropical coconut scent.', imageAlt: '8 fl oz Gaviota by Lia Coconut Body Scrub jar' },
  'crema-hidratante': { name: 'Hydrating Body Cream', shortDescription: 'Deep, fast-absorbing hydration for everyday softness.', imageAlt: '8 fl oz Gaviota by Lia Hydrating Body Cream jar' },
  'serum-vellos-encarnados': { name: 'Ingrown Hair Serum', shortDescription: 'Post-hair-removal care for smoother-looking skin.', imageAlt: '2 fl oz Gaviota by Lia Ingrown Hair Serum bottle' },
  'aceite-anti-estrias-masculino': { name: "Men's Stretch Mark Body Oil", shortDescription: 'Firming hydration for soft, luminous-looking skin.', imageAlt: "4 fl oz Gaviota by Lia Men's Stretch Mark Body Oil dropper bottle" },
  'tonico-para-barba': { name: 'Beard Tonic', shortDescription: 'Beard tonic for daily use.', imageAlt: 'Gaviota by Lia Beard Tonic bottle next to its box' },
  'sunscreen': { name: 'Sunscreen', shortDescription: 'Moisturizing formula for daily use.', imageAlt: '2 fl oz Gaviota by Lia Sunscreen pump bottle' },
};

function localizeProduct(product: Product, locale: Locale): Product {
  return locale === 'en' ? { ...product, ...ENGLISH[product.slug] } : product;
}

export async function getFeaturedProducts(locale: Locale = 'en'): Promise<readonly Product[]> {
  return CATALOG.filter((p) => p.featured).map((p) => localizeProduct(p, locale));
}

export async function getAllProducts(locale: Locale = 'en'): Promise<readonly Product[]> {
  return CATALOG.map((p) => localizeProduct(p, locale));
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((category) => category.slug === value);
}

export function isCatalogSort(value: string): value is CatalogSort {
  return value === 'featured' || value === 'price-asc' || value === 'price-desc';
}

export async function queryProducts(
  query: CatalogQuery,
  locale: Locale = 'en',
): Promise<readonly Product[]> {
  return filterCatalogProducts(
    CATALOG.map((product) => localizeProduct(product, locale)),
    query,
  );
}

export async function getProductBySlug(slug: string, locale: Locale = 'en'): Promise<Product | null> {
  const product = CATALOG.find((p) => p.slug === slug);
  return product ? localizeProduct(product, locale) : null;
}
