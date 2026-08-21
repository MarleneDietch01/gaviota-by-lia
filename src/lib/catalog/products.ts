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
 *   · ingredients/precautions/usageInstructions -> transcritos de las
 *     etiquetas físicas fotografiadas (bilingües de origen; el inglés no lo
 *     tradujo esta aplicación). Resuelve CONTENT_TODO.md C1/C2/C3 para los
 *     4 productos que ya tienen etiqueta: aceite, exfoliante, crema
 *     hidratante y sérum. `aceite-anti-estrias-masculino` y
 *     `tonico-para-barba` siguen sin este dato — C16 no está resuelto (no se
 *     confirma que el masculino comparta fórmula con el femenino) y el
 *     tónico no tiene etiqueta fotografiada todavía.
 *
 * DELIBERADAMENTE AUSENTES, porque no existe el dato:
 *   · compareAtPrice  -> los 8 productos del sitio actual tienen descuento
 *                        permanente sin vigencia. No se replica.
 *   · rating / reviewCount -> el sitio actual no tiene NI UNA reseña.
 *   · peso -> pendiente (CONTENT_TODO.md C7)
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
  /**
   * Lista INCI tal cual aparece en la etiqueta física. Nomenclatura
   * internacional estandarizada: no se traduce entre idiomas.
   * Resuelve CONTENT_TODO.md C1 para los productos que ya tienen etiqueta
   * fotografiada — los que no la tienen se quedan sin este campo (`tonico-para-barba`,
   * `aceite-anti-estrias-masculino`: C16 sigue sin resolver si es la misma
   * fórmula que la versión femenina o no, así que no se asume).
   */
  readonly ingredients?: string;
  /** Bloque "PRECAUCIONES" de la etiqueta. Resuelve C2. */
  readonly precautions?: string;
  /** Bloque "MODO DE USO" de la etiqueta. Resuelve C3. */
  readonly usageInstructions?: string;
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
    ingredients:
      'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragance/Parfum, Glycine Soja Oil.',
    precautions:
      'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
    usageInstructions:
      'Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.',
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
    ingredients:
      'Sacarosa, Prunus Amygdalus Dulcis Oil, Simmondsia Chinensis Seed Oil, Fragance/Parfum, Cocos Nucifera Oil, Phenoxyethanol, Benzoato De Sosa.',
    precautions:
      'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
    usageInstructions:
      'Aplicar en la piel húmeda una cantidad moderada y dar masajes circulares durante unos 3-5 minutos en el área deseada. Luego retirar con abundante agua. Para óptimos resultados, utilizar dos veces por semana.',
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
    ingredients:
      'Aqua, Stearic Acid, Isopropyl Myristate, Paraffinum Liquidum, Glyceryl Stearate, Ethylhexyl Methoxycinnamate, Morus Nigra Fruit Extract, Hydrogenated Castor Oil, Glycerin, Cocos Nucifera Fruit Extract, Triethanolamine, Cetyl Alcohol, Carbomer, Phenoxyethanol, Parfum, Sodium PCA, Hydroxystearic Acid, Sodium Hydroxide, Disodium EDTA, Sodium Ascorbyl Phosphate, Alpha-Isomethyl Ionone, Benzyl Benzoate, Butylphenyl Methylpropional.',
    precautions:
      'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
    usageInstructions:
      'Aplicar una moderada cantidad en el área a tratar, dando suaves masajes circulares hasta que la piel absorba por completo. Se recomienda utilizar en las noches.',
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
    ingredients:
      'Aqua, Propylene Glycol, 3-O-Ethyl Ascorbic Acid, Tocopheryl Acetate, Polyisobutene, Polysorbate 20, Sorbitan Isostearate, Hyaluronic Acid, Xanthan Gum, Benzoic Acid, Sorbic Acid, Salicylic Acid, Lactic Acid, Citric Acid, Benzyl Alcohol, Sodium Polyacrylate.',
    precautions:
      'Mantener fuera del alcance de los niños. En caso de irritación, suspender su uso. Evitar el contacto con los ojos. Uso externo.',
    usageInstructions:
      'Aplique el producto después de la depilación para calmar la piel y prevenir los pelos encarnados.',
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
    // Del propio envase: "USO DIARIO". No se reproducen los claims impresos en
    // la etiqueta ("Rellena los vacíos", "Estimula y acelera el crecimiento",
    // "Combatiendo las caídas"): son claims de crecimiento capilar, categoría
    // de medicamento, pendientes de reescritura (CONTENT_TODO C15, LEGAL_TODO
    // L8). Ingredientes, precauciones y modo de uso sí son datos factuales de
    // la etiqueta, sin ese problema.
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
    categorySlug: 'cuidado-masculino',
    needSlugs: [],
    ingredients:
      'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragance/Parfum, Glycine Soja Oil.',
    precautions:
      'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
    usageInstructions:
      'Aplicar el spray sobre la barba limpia y seca, masajeando suavemente la piel para favorecer la absorción. Usar 1-2 veces al día de forma constante para mejores resultados.',
  },
];

// SIGUEN FUERA, por falta de dato o por decisión:
//   · Sunscreen           -> RETIRADO A PROPÓSITO. Decisión explícita de la
//     propietaria: no se vende protector solar en la web (evita por completo
//     el riesgo de LEGAL_TODO.md L2 — en EE. UU. un SPF es medicamento OTC,
//     no cosmético).
//   · Crema Anti-Estrías -> hay packshot (recortado de GA9) pero no existe
//     precio en ninguna parte: nunca se vendió online. Falta precio y descripción.
//   · Producto labial    -> ni packshot ni precio ni nombre confirmado.
//   · Kit                -> su única fotografía lleva "KIT ANTI-ESTRÍAS Y
//     ACLARACIÓN" quemado en la imagen, y "aclaración" es justamente el término
//     regulado que se decidió retirar del nombre comercial.

// `ingredients` no se traduce (nomenclatura INCI internacional) — solo
// `precautions`/`usageInstructions`, tomados literalmente del lado inglés de
// la misma etiqueta bilingüe, no traducidos por esta aplicación.
const ENGLISH: Record<
  string,
  Pick<Product, 'name' | 'shortDescription' | 'imageAlt' | 'precautions' | 'usageInstructions'>
> = {
  'aceite-anti-estrias': {
    name: 'Stretch Mark Body Oil',
    shortDescription: 'Firming hydration for soft, luminous-looking skin.',
    imageAlt: '4 fl oz Gaviota by Lia Stretch Mark Body Oil dropper bottle',
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply to the desired area and massage in circular motions for a few minutes. For optimal results, apply after bathing, twice a day.',
  },
  'exfoliante-de-coco': {
    name: 'Coconut Body Scrub',
    shortDescription: 'Gentle exfoliation with a tropical coconut scent.',
    imageAlt: '8 fl oz Gaviota by Lia Coconut Body Scrub jar',
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply a moderate amount to damp skin and massage in circular motions for 3-5 minutes on the desired area. Then remove with plenty of water. For optimal results, use twice a week.',
  },
  'crema-hidratante': {
    name: 'Hydrating Body Cream',
    shortDescription: 'Deep, fast-absorbing hydration for everyday softness.',
    imageAlt: '8 fl oz Gaviota by Lia Hydrating Body Cream jar',
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply a moderate amount to the area to be treated, massaging gently in a circular motion until completely absorbed by the skin. It is recommended to use at night.',
  },
  'serum-vellos-encarnados': {
    name: 'Ingrown Hair Serum',
    shortDescription: 'Post-hair-removal care for smoother-looking skin.',
    imageAlt: '2 fl oz Gaviota by Lia Ingrown Hair Serum bottle',
    precautions: 'Keep out of reach of children. If irritation occurs, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply the product after waxing to soothe the skin and prevent ingrown hairs.',
  },
  'aceite-anti-estrias-masculino': {
    name: "Men's Stretch Mark Body Oil",
    shortDescription: 'Firming hydration for soft, luminous-looking skin.',
    imageAlt: "4 fl oz Gaviota by Lia Men's Stretch Mark Body Oil dropper bottle",
  },
  'tonico-para-barba': {
    name: 'Beard Tonic',
    shortDescription: 'Beard tonic for daily use.',
    imageAlt: 'Gaviota by Lia Beard Tonic bottle next to its box',
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply the spray to a clean, dry beard, gently massaging it into the skin to promote absorption. Use 1-2 times daily for consistent, best results.',
  },
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
