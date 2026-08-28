import 'server-only';
import type { Cents } from '@/lib/commerce/money';
import { cents } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';
import { filterCatalogProducts } from '@/lib/catalog/query';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

/**
 * Catálogo.
 *
 * -----------------------------------------------------------------------------
 * ESTADO: leyendo de Supabase (`products`/`product_variants`/`product_images`).
 *
 * Migrado desde el array estático que vivía en este archivo (ver historial de
 * git para el comentario original y la procedencia de cada dato). El array
 * seguía comentando "la lectura real de Supabase se conecta en cuanto exista
 * el proyecto" mucho después de que el proyecto existiera y de que el checkout
 * ya escribiera pedidos reales — esta migración cierra esa brecha para que
 * `/admin/products` tenga efecto real en lo que ve la clienta.
 *
 * Las firmas de `getFeaturedProducts`/`getAllProducts`/`queryProducts`/
 * `getProductBySlug` NO cambian: todo el resto del código (storefront,
 * checkout, sitemap) sigue llamándolas igual.
 *
 * SIMPLIFICACIONES DELIBERADAS (documentadas también en el informe de
 * entrega del rediseño de /admin):
 *
 *   · i18n: la tabla `products` no tiene columnas de idioma (un solo
 *     `name`/`short_description`/`description`/... en español). El español de
 *     la base de datos es la fuente de verdad editable desde /admin; el
 *     override en inglés que ya existía en el array estático (`ENGLISH`,
 *     abajo) se conserva tal cual como capa de traducción manual sobre esos
 *     campos. No se añaden columnas `*_en` — eso es una decisión de producto
 *     mayor (¿quién traduce cuando se edita el español?) que no corresponde
 *     tomar en silencio.
 *
 *   · `imageBackground` (color del ciclorama bajo el packshot): no existe
 *     columna equivalente en `product_images`, y no hay pipeline de muestreo
 *     de píxel conectado a la subida desde admin. Los 6 productos ya
 *     fotografiados conservan su color exacto vía `LEGACY_IMAGE_BACKGROUND`
 *     (mapa local, no editable desde admin). Cualquier producto nuevo dado de
 *     alta por admin recibe el valor por defecto del token `white-warm`. Ver
 *     el informe de entrega para la recomendación de construir el pipeline
 *     real más adelante.
 * -----------------------------------------------------------------------------
 */

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortDescription: string;
  readonly price: Cents;
  readonly sizeLabel: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  /** Ver nota de simplificación arriba: `LEGACY_IMAGE_BACKGROUND` o el token `white-warm`. */
  readonly imageBackground: string;
  /**
   * Todas las fotos del producto, en orden (`sort_order`, la principal
   * primero). Hoy es siempre un array de 1 elemento — igual a
   * `image`/`imageAlt`/... arriba — porque ningún producto tiene más de una
   * foto real todavía. `ProductGallery` la consume ya preparada para 1-N: no
   * hace falta tocar este campo cuando exista fotografía adicional, solo
   * subirla desde /admin/products.
   */
  readonly images: readonly { src: string; alt: string; width: number; height: number }[];
  readonly featured: boolean;
  /** Se muestran estrellas solo si es > 0. Hoy siempre es 0 (sin sistema de agregación todavía). */
  readonly reviewCount: number;
  readonly categorySlug: CategorySlug;
  readonly needSlugs: readonly NeedSlug[];
  readonly ingredients?: string | undefined;
  readonly precautions?: string | undefined;
  readonly usageInstructions?: string | undefined;
  /**
   * Unidades disponibles (`stock_quantity - reserved_quantity`) de la
   * variante principal del producto. `null` cuando `track_inventory = false`
   * (sin control de inventario: siempre comprable).
   */
  readonly stockAvailable: number | null;
  /** Derivado de `stockAvailable`: `false` bloquea la compra en el checkout. */
  readonly inStock: boolean;
  /** Id de la variante principal — lo necesita el checkout para reservar inventario. */
  readonly variantId: string | null;
  /**
   * `true` cuando el español se editó desde /admin/products después de la
   * última confirmación de que el override en inglés (`ENGLISH`, abajo) sigue
   * vigente. Solo importa en locale `en`: en español la base de datos es la
   * fuente de verdad, así que nunca puede estar "desactualizada" respecto a
   * sí misma. `localizeProduct()` la usa para apagar `contentComplete` en
   * inglés en vez de servir texto viejo sin avisar.
   */
  readonly translationStale: boolean;
  readonly contentComplete?: boolean;
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

/**
 * `needSlugs` no tiene columna en el esquema (era metadata de recomendación
 * puramente editorial, sin uso comercial hoy más allá de `/rituals`). Se
 * mantiene como mapa local por slug — no es un dato que la dueña necesite
 * editar desde /admin, es taxonomía de contenido fijada por el equipo.
 */
const NEED_SLUGS_BY_PRODUCT: Record<string, readonly NeedSlug[]> = {
  'aceite-anti-estrias': ['hidratacion', 'estrias'],
  'exfoliante-de-coco': ['textura'],
  'crema-hidratante': ['hidratacion'],
  'serum-vellos-encarnados': ['post-depilacion'],
  'aceite-anti-estrias-masculino': ['hidratacion', 'estrias'],
  'tonico-para-barba': [],
};

/** Packshots existentes en `public/`, hasta que existan uploads reales via admin. */
const LEGACY_IMAGE: Record<string, { path: string; alt: string; width: number; height: number }> = {
  'aceite-anti-estrias': {
    path: '/images/gaviota/products/aceite-anti-estrias-studio.jpg',
    alt: 'Frasco con gotero del Aceite Anti-Estrías Gaviota by Lia de 115 mL',
    width: 1200,
    height: 1200,
  },
  'exfoliante-de-coco': {
    path: '/images/gaviota/products/exfoliante-de-coco-studio.jpg',
    alt: 'Tarro del Exfoliante de Coco Gaviota by Lia de 236 mL',
    width: 1200,
    height: 1200,
  },
  'crema-hidratante': {
    path: '/images/gaviota/products/crema-hidratante-studio.jpg',
    alt: 'Tarro de la Crema Hidratante Gaviota by Lia de 236 mL',
    width: 1200,
    height: 1200,
  },
  'serum-vellos-encarnados': {
    path: '/images/gaviota/products/serum-vellos-encarnados-studio.jpg',
    alt: 'Frasco del Sérum Vellos Encarnados Gaviota by Lia de 59 mL',
    width: 1200,
    height: 1200,
  },
  'aceite-anti-estrias-masculino': {
    path: '/images/gaviota/products/aceite-anti-estrias-masculino-studio.jpg',
    alt: 'Frasco con gotero del Aceite Anti-Estrías Masculino Gaviota by Lia de 115 mL',
    width: 1200,
    height: 1200,
  },
  'tonico-para-barba': {
    path: '/images/gaviota/products/tonico-para-barba-studio.jpg',
    alt: 'Tónico Para Barba Gaviota by Lia junto a su estuche',
    width: 1200,
    height: 1200,
  },
};

/**
 * Fotos de estilo de vida adicionales, entregadas directamente como archivo
 * (no vía /admin/products → Storage). Se añaden siempre al final de
 * `images`, sin importar si la foto principal viene de Storage o de
 * `LEGACY_IMAGE` arriba — a diferencia de esa, esta lista no se apaga sola
 * cuando el producto ya tiene fotos reales en `product_images`.
 */
const STATIC_SECONDARY_IMAGES: Record<
  string,
  { path: string; alt: string; altEn: string; width: number; height: number }[]
> = {
  'exfoliante-de-coco': [
    {
      path: '/images/gaviota/products/modelo3.png',
      alt: 'Mujer utilizando el Exfoliante de Coco Gaviota by Lia en la pierna',
      altEn: 'Woman using Gaviota by Lia Coconut Body Scrub on her leg',
      width: 1122,
      height: 1402,
    },
  ],
  'crema-hidratante': [
    {
      path: '/images/gaviota/products/Modelo4.png',
      alt: 'Mujer aplicándose la Crema Hidratante Gaviota by Lia en el brazo',
      altEn: 'Woman applying Gaviota by Lia Hydrating Body Cream to her arm',
      width: 1122,
      height: 1402,
    },
  ],
  'serum-vellos-encarnados': [
    {
      path: '/images/gaviota/products/Modelo7.png',
      alt: 'Hombre aplicándose el Sérum Vellos Encarnados Gaviota by Lia en el hombro',
      altEn: 'Man applying Gaviota by Lia Ingrown Hair Serum to his shoulder',
      width: 971,
      height: 1619,
    },
  ],
  'aceite-anti-estrias-masculino': [
    {
      path: '/images/gaviota/products/modelo6.png',
      alt: 'Hombre aplicándose el Aceite Anti-Estrías Masculino Gaviota by Lia en el brazo',
      altEn: "Man applying Gaviota by Lia Men's Stretch Mark Body Oil to his arm",
      width: 1122,
      height: 1402,
    },
  ],
  'tonico-para-barba': [
    {
      path: '/images/gaviota/products/modelo2.png',
      alt: 'Hombre aplicándose el Tónico Para Barba Gaviota by Lia frente al espejo',
      altEn: 'Man applying Gaviota by Lia Beard Tonic in front of the mirror',
      width: 1122,
      height: 1402,
    },
  ],
  'aceite-anti-estrias': [
    {
      path: '/images/gaviota/products/Modelo5.png',
      alt: 'Mujer aplicándose el Aceite Anti-Estrías Gaviota by Lia en el brazo',
      altEn: 'Woman applying Gaviota by Lia Stretch Mark Body Oil to her arm',
      width: 1122,
      height: 1402,
    },
  ],
};

/** Color del ciclorama de las 6 fotos ya existentes. Ver nota de simplificación arriba. */
const LEGACY_IMAGE_BACKGROUND: Record<string, string> = {
  'aceite-anti-estrias': '#ffffff',
  'exfoliante-de-coco': '#ffffff',
  'crema-hidratante': '#ffffff',
  'serum-vellos-encarnados': '#ffffff',
  'aceite-anti-estrias-masculino': '#ffffff',
  // La foto principal actual viene de Storage sobre lienzo blanco. El gris
  // heredado del packshot anterior quedaba visible arriba y abajo dentro del
  // tile 4:5, creando dos franjas que hacían parecer la imagen recortada.
  'tonico-para-barba': '#ffffff',
};

/** Fallback para productos dados de alta desde admin sin foto todavía (token `white-warm`). */
const DEFAULT_IMAGE_BACKGROUND = '#ffffff';

// `ingredients` no se traduce (nomenclatura INCI internacional) — solo
// `precautions`/`usageInstructions`, tomados literalmente del lado inglés de
// la misma etiqueta bilingüe, no traducidos por esta aplicación.
const ENGLISH: Record<
  string,
  Partial<Pick<Product, 'name' | 'shortDescription' | 'imageAlt' | 'precautions' | 'usageInstructions'>>
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
    // Misma etiqueta bilingüe que el Aceite Anti-Estrías.
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply to the desired area and massage in circular motions for a few minutes. For optimal results, apply after bathing, twice a day.',
  },
  'tonico-para-barba': {
    name: 'Beard Tonic',
    shortDescription: 'Conditions, softens and helps tame your beard, with a fresh everyday scent.',
    imageAlt: 'Gaviota by Lia Beard Tonic spray bottle',
    precautions: 'Keep out of reach of children. In case of irritation, discontinue use. Avoid contact with eyes. External use.',
    usageInstructions: 'Apply the spray to a clean, dry beard, gently massaging it into the skin to promote absorption. Use 1-2 times daily for consistent, best results.',
  },
};

/**
 * Packshot con la etiqueta en inglés. Es un archivo aparte, no la foto en
 * español con el texto traducido por CSS — el envase fotografiado es distinto.
 *
 * Se aplica SIEMPRE en locale `en` (igual que el `ENGLISH` de texto de arriba
 * pisa el nombre y la descripción), sustituyendo a la foto principal venga de
 * `LEGACY_IMAGE` o de Storage. Hoy no existe un flujo en /admin para subir una
 * foto por idioma, así que este mapa es la única fuente del packshot inglés.
 *
 * `serum-vellos-encarnados` no tiene versión en inglés todavía: en `en` cae a
 * la foto en español con el `imageAlt` de `ENGLISH`.
 *
 * Solo cubre la foto PRINCIPAL. Si algún producto llega a tener varias fotos de
 * Storage, las secundarias seguirían en español — no ocurre hoy (ninguno pasa
 * de una).
 */
const ENGLISH_IMAGE: Record<string, { path: string; width: number; height: number }> = {
  'aceite-anti-estrias': { path: '/images/gaviota/products/aceite-anti-estrias-en.png', width: 1254, height: 1254 },
  'exfoliante-de-coco': { path: '/images/gaviota/products/exfoliante-de-coco-en.png', width: 1254, height: 1254 },
  'crema-hidratante': { path: '/images/gaviota/products/crema-hidratante-en.png', width: 1254, height: 1254 },
  'aceite-anti-estrias-masculino': { path: '/images/gaviota/products/aceite-anti-estrias-masculino-en.png', width: 1254, height: 1254 },
  'tonico-para-barba': { path: '/images/gaviota/products/tonico-para-barba-en.png', width: 1254, height: 1254 },
};

function localizeProduct(product: Product, locale: Locale): Product {
  if (locale !== 'en') return product;

  const en = ENGLISH[product.slug];
  const enImage = ENGLISH_IMAGE[product.slug];

  // `alt` en inglés de las fotos de estilo de vida, indexado por su ruta —
  // `product.images` ya no lleva el idioma, solo la cadena en español.
  const lifestyleAltEn = new Map(
    (STATIC_SECONDARY_IMAGES[product.slug] ?? []).map((s) => [s.path, s.altEn] as const),
  );

  const images = product.images.map((img, index) => {
    if (index === 0) {
      return {
        ...img,
        ...(enImage ? { src: enImage.path, width: enImage.width, height: enImage.height } : {}),
        ...(en?.imageAlt ? { alt: en.imageAlt } : {}),
      };
    }
    const altEn = lifestyleAltEn.get(img.src);
    return altEn ? { ...img, alt: altEn } : img;
  });

  return {
    ...product,
    ...en,
    ...(enImage
      ? { image: enImage.path, imageWidth: enImage.width, imageHeight: enImage.height }
      : {}),
    images,
    // El español se editó y nadie confirmó todavía que el inglés de arriba
    // sigue vigente: no se sirve tal cual sin avisar. Reutiliza el mismo
    // aviso "ficha en ampliación" que ya existe para contenido incompleto,
    // en vez de inventar un elemento visual nuevo para este caso. La clave
    // solo se incluye cuando aplica: con `exactOptionalPropertyTypes`, escribir
    // `contentComplete: undefined` no es lo mismo que omitir la clave.
    ...(product.translationStale ? { contentComplete: false as const } : {}),
  };
}

type ProductRow = Database['public']['Tables']['products']['Row'] & {
  categories: { slug: string } | null;
  product_variants: Array<Pick<Database['public']['Tables']['product_variants']['Row'],
    'id' | 'stock_quantity' | 'reserved_quantity' | 'status'>>;
  product_images: Array<Pick<Database['public']['Tables']['product_images']['Row'],
    'storage_path' | 'alt_text' | 'width' | 'height' | 'is_primary' | 'sort_order'>>;
};

const PRODUCT_SELECT = `
  id, slug, name, short_description, base_price, size_label, status, featured,
  ingredients_text, precautions, usage_instructions, track_inventory, translation_stale,
  categories:category_id ( slug ),
  product_variants ( id, stock_quantity, reserved_quantity, status ),
  product_images ( storage_path, alt_text, width, height, is_primary, sort_order )
`;

const STORAGE_BUCKET = 'products';

function publicImageUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}

/** Convierte una fila de `products` (con sus joins) al `Product` de dominio. */
function toProduct(row: ProductRow, supabaseUrl: string): Product {
  const primaryVariant = row.product_variants.find((v) => v.status === 'active') ?? row.product_variants[0] ?? null;
  const stockAvailable = row.track_inventory && primaryVariant
    ? Math.max(0, primaryVariant.stock_quantity - primaryVariant.reserved_quantity)
    : null;

  const primaryImage = row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
  const legacy = LEGACY_IMAGE[row.slug];
  const image = primaryImage
    ? {
        path: publicImageUrl(supabaseUrl, primaryImage.storage_path),
        alt: primaryImage.alt_text,
        width: primaryImage.width,
        height: primaryImage.height,
      }
    : legacy ?? {
        // Sin foto todavía: no se inventa una imagen. El componente de
        // packshot debe tolerar esto (placeholder de marca), no romperse.
        path: '/images/gaviota/products/placeholder.jpg',
        alt: row.name,
        width: 1200,
        height: 1200,
      };

  // Todas las fotos reales de Storage, ordenadas, principal primero. Sin
  // fila real ninguna, cae a la misma imagen única de arriba (legacy o
  // placeholder) como array de 1 — `ProductGallery` no tiene que distinguir
  // el origen del dato, solo cuántas hay.
  const dbImages = [...row.product_images]
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)
    .map((img) => ({
      src: publicImageUrl(supabaseUrl, img.storage_path),
      alt: img.alt_text,
      width: img.width,
      height: img.height,
    }));
  const staticSecondary = (STATIC_SECONDARY_IMAGES[row.slug] ?? []).map((s) => ({
    src: s.path,
    alt: s.alt,
    width: s.width,
    height: s.height,
  }));
  const images = [
    ...(dbImages.length > 0 ? dbImages : [{ src: image.path, alt: image.alt, width: image.width, height: image.height }]),
    ...staticSecondary,
  ];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? '',
    price: cents(row.base_price),
    sizeLabel: row.size_label ?? '',
    image: image.path,
    imageAlt: image.alt,
    imageWidth: image.width,
    imageHeight: image.height,
    imageBackground: LEGACY_IMAGE_BACKGROUND[row.slug] ?? DEFAULT_IMAGE_BACKGROUND,
    images,
    featured: row.featured,
    reviewCount: 0,
    categorySlug: (row.categories?.slug as CategorySlug) ?? 'aceites-y-serums',
    needSlugs: NEED_SLUGS_BY_PRODUCT[row.slug] ?? [],
    ingredients: row.ingredients_text ?? undefined,
    precautions: row.precautions ?? undefined,
    usageInstructions: row.usage_instructions ?? undefined,
    stockAvailable,
    inStock: stockAvailable === null || stockAvailable > 0,
    variantId: primaryVariant?.id ?? null,
    translationStale: row.translation_stale,
  };
}

async function fetchActiveProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[catalog] failed to load products:', error);
    return [];
  }

  return (data as unknown as ProductRow[]).map((row) => toProduct(row, supabaseUrl));
}

export async function getFeaturedProducts(locale: Locale = 'en'): Promise<readonly Product[]> {
  const products = await fetchActiveProducts();
  return products.filter((p) => p.featured).map((p) => localizeProduct(p, locale));
}

export async function getAllProducts(locale: Locale = 'en'): Promise<readonly Product[]> {
  const products = await fetchActiveProducts();
  return products.map((p) => localizeProduct(p, locale));
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
  const products = await fetchActiveProducts();
  return filterCatalogProducts(
    products.map((product) => localizeProduct(product, locale)),
    query,
  );
}

/**
 * Busca por slug entre los productos publicados (`status = 'active'`). Un
 * producto despublicado deja de resolverse aquí — el checkout y la ficha de
 * producto lo tratan igual que "no existe" (404 / línea rechazada), que es el
 * comportamiento correcto: despublicar debe impedir la compra.
 */
export async function getProductBySlug(slug: string, locale: Locale = 'en'): Promise<Product | null> {
  const supabase = await createServerSupabaseClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;

  const product = toProduct(data as unknown as ProductRow, supabaseUrl);
  return localizeProduct(product, locale);
}
