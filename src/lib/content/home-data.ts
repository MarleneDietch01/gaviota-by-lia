import type { Locale } from '@/lib/i18n';

/**
 * Datos estructurados de la home.
 *
 * Antes vivían como constantes sueltas dentro del JSX, con mapas
 * `Record<string,string>` en línea cuya CLAVE era la frase en español. Corregir
 * una tilde rompía la traducción en silencio. Aquí cada entrada lleva sus dos
 * idiomas juntos y el tipo obliga a completar ambos.
 *
 * REGLA DE CONTENIDO: nada de aquí está inventado. Cada texto describe una
 * sensación, un uso o un origen — nunca un resultado, un porcentaje, un
 * ingrediente activo ni una certificación. Ver `docs/LEGAL_TODO.md`.
 */

export interface Bilingual {
  readonly en: string;
  readonly es: string;
}

export function t(value: Bilingual, locale: Locale): string {
  return locale === 'es' ? value.es : value.en;
}

/* ===========================================================================
   1. Beneficios rápidos
   ---------------------------------------------------------------------------
   Los cuatro los fijó la propietaria en el brief. Tres son verificables hoy
   (origen, selección de ingredientes, enfoque de ritual). "Small-batch" es una
   afirmación de producción que ELLA debe confirmar antes de publicar: queda
   anotado en el informe, no se elimina.
   =========================================================================== */
export interface Benefit {
  readonly icon: 'origin' | 'leaf' | 'batch' | 'ritual';
  readonly title: Bilingual;
  readonly body: Bilingual;
}

export const BENEFITS: readonly Benefit[] = [
  {
    icon: 'origin',
    title: { en: 'Dominican-made', es: 'Hecho en República Dominicana' },
    body: {
      en: 'Created and produced on the island, where the brand was born.',
      es: 'Creado y producido en la isla, donde nació la marca.',
    },
  },
  {
    icon: 'leaf',
    title: { en: 'Skin-loving ingredients', es: 'Ingredientes que cuidan' },
    body: {
      en: 'Selected for how they feel on real skin, day after day.',
      es: 'Seleccionados por cómo se sienten sobre la piel real, día tras día.',
    },
  },
  {
    icon: 'batch',
    title: { en: 'Small-batch care', es: 'Producción en lotes pequeños' },
    body: {
      en: 'Made in short runs so every jar leaves as it should.',
      es: 'Elaborado en tiradas cortas para cuidar cada envase.',
    },
  },
  {
    icon: 'ritual',
    title: { en: 'Ritual-first formulas', es: 'Fórmulas pensadas como ritual' },
    body: {
      en: 'Textures and scents made to be looked forward to.',
      es: 'Texturas y aromas pensados para que apetezca repetir.',
    },
  },
];

/* ===========================================================================
   2. "Build your ritual" — selector por necesidad
   ---------------------------------------------------------------------------
   CINCO opciones, no las ocho de la dirección creativa original: solo hay cinco
   con un producto real detrás. "Cuidado labial" y "Protección solar" se omiten
   (uno sin confirmar, otro bloqueado por documentación regulatoria).

   Se nombra el CUIDADO, nunca el defecto: "Apariencia de estrías", no "problema
   de estrías". La marca celebra cuerpos reales; el copy tiene que hacerlo igual.
   =========================================================================== */
export interface RitualNeed {
  readonly href: string;
  readonly title: Bilingual;
  readonly body: Bilingual;
  readonly image: string;
  readonly alt: Bilingual;
  readonly focal: string;
  readonly fit?: 'cover' | 'contain';
}

export const RITUAL_NEEDS: readonly RitualNeed[] = [
  {
    href: '/categories/cremas-e-hidratacion',
    title: { en: 'Hydration', es: 'Hidratación' },
    body: {
      en: 'So skin feels comfortable all day long.',
      es: 'Para que la piel se sienta cómoda todo el día.',
    },
    image: '/images/gaviota/editorial/campaign-aplicacion.jpg',
    focal: '38% 30%',
    alt: {
      en: 'Woman applying a Gaviota by Lia cream to her shoulder',
      es: 'Mujer aplicando una crema Gaviota by Lia sobre su hombro',
    },
  },
  {
    href: '/products/aceite-anti-estrias',
    title: { en: 'Stretch mark care', es: 'Apariencia de estrías' },
    body: {
      en: 'Nourishing oils for smoother-looking skin.',
      es: 'Aceites que ayudan a mejorar su apariencia.',
    },
    image: '/images/gaviota/products/aceite-anti-estrias-studio.jpg',
    focal: '50% 50%',
    fit: 'contain',
    alt: {
      en: 'Gaviota by Lia Stretch Mark Body Oil bottle',
      es: 'Frasco del Aceite Anti-Estrías Gaviota by Lia',
    },
  },
  {
    href: '/products/exfoliante-de-coco',
    title: { en: 'Exfoliation & texture', es: 'Exfoliación y textura' },
    body: {
      en: 'Prep your skin for everything that follows.',
      es: 'Prepara la piel para todo lo que viene después.',
    },
    image: '/images/gaviota/products/exfoliante-de-coco-studio.jpg',
    focal: '50% 50%',
    fit: 'contain',
    alt: {
      en: 'Gaviota by Lia Coconut Body Scrub jar',
      es: 'Tarro del Exfoliante de Coco Gaviota by Lia',
    },
  },
  {
    href: '/products/serum-vellos-encarnados',
    title: { en: 'Ingrown hair care', es: 'Vellos encarnados' },
    body: {
      en: 'Thoughtful care after hair removal.',
      es: 'Cuidado después de la depilación.',
    },
    image: '/images/gaviota/products/serum-vellos-encarnados-studio.jpg',
    focal: '50% 50%',
    fit: 'contain',
    alt: {
      en: 'Gaviota by Lia ingrown hair serum bottle',
      es: 'Frasco del sérum para vellos encarnados Gaviota by Lia',
    },
  },
  {
    href: '/sets',
    title: { en: 'Complete routine', es: 'Rutina completa' },
    body: {
      en: 'All three steps in one set.',
      es: 'Los tres pasos, en un solo kit.',
    },
    image: '/images/gaviota/editorial/coleccion-completa.jpg',
    focal: '50% 52%',
    fit: 'contain',
    alt: {
      en: 'The full Gaviota by Lia product line',
      es: 'Línea completa de productos Gaviota by Lia',
    },
  },
];

/* ===========================================================================
   3. Ritual en tres pasos
   ---------------------------------------------------------------------------
   El orden mostrado está PENDIENTE de confirmación por la propietaria
   (CONTENT_TODO.md C9). La sección se construye; el contenido se ajustará.
   =========================================================================== */
export interface RitualStep {
  readonly n: string;
  readonly verb: Bilingual;
  readonly body: Bilingual;
  readonly product: Bilingual;
  readonly href: string;
  readonly image: string;
  readonly alt: Bilingual;
  readonly focal: string;
}

export const RITUAL_STEPS: readonly RitualStep[] = [
  {
    n: '01',
    verb: { en: 'Exfoliate', es: 'Exfolia' },
    body: {
      en: 'Massage onto damp skin in circular motions, two or three times a week.',
      es: 'Sobre la piel húmeda, en movimientos circulares. Dos o tres veces por semana.',
    },
    product: { en: 'Coconut Body Scrub', es: 'Exfoliante de Coco' },
    href: '/products/exfoliante-de-coco',
    image: '/images/gaviota/editorial/ritual-exfolia.jpg',
    focal: '50% 55%',
    alt: {
      en: 'Woman applying Gaviota by Lia scrub to her leg',
      es: 'Mujer aplicando exfoliante Gaviota by Lia en su pierna',
    },
  },
  {
    n: '02',
    verb: { en: 'Hydrate', es: 'Hidrata' },
    body: {
      en: 'Apply while skin is still warm, so hydration stays where it belongs.',
      es: 'Con la piel aún templada, para que la hidratación se quede donde tiene que estar.',
    },
    product: { en: 'Hydrating Body Cream', es: 'Crema Hidratante' },
    href: '/products/crema-hidratante',
    image: '/images/gaviota/editorial/ritual-hidrata.jpg',
    focal: '45% 42%',
    alt: {
      en: 'Woman applying Gaviota by Lia body cream to her shoulder',
      es: 'Mujer aplicando crema hidratante Gaviota by Lia sobre su hombro',
    },
  },
  {
    n: '03',
    verb: { en: 'Nourish', es: 'Nutre' },
    body: {
      en: 'A few drops wherever your skin asks for them — the step that turns routine into ritual.',
      es: 'Unas gotas donde la piel lo pida. El paso que convierte la rutina en ritual.',
    },
    product: { en: 'Stretch Mark Body Oil', es: 'Aceite Anti-Estrías' },
    href: '/products/aceite-anti-estrias',
    image: '/images/gaviota/editorial/ritual-labios.jpg',
    focal: '52% 38%',
    alt: {
      en: 'Woman holding a Gaviota by Lia product',
      es: 'Mujer sosteniendo un producto Gaviota by Lia',
    },
  },
];

/* ===========================================================================
   4. Ingredientes destacados
   ---------------------------------------------------------------------------
   Los tres los pidió el brief. El coco es verificable: está impreso en la
   etiqueta del Exfoliante de Coco (leída en GA9.jpg).
   Los otros dos son CATEGORÍAS sensoriales, no principios activos concretos, y
   están redactados a propósito sin nombrar INCI ni prometer resultado: la lista
   completa de ingredientes sigue pendiente (CONTENT_TODO.md C1).
   =========================================================================== */
export interface Ingredient {
  readonly key: string;
  readonly name: Bilingual;
  readonly body: Bilingual;
  /** true => el dato está confirmado por etiqueta. false => pendiente. */
  readonly verified: boolean;
}

export const INGREDIENTS: readonly Ingredient[] = [
  {
    key: 'coconut',
    name: { en: 'Coconut', es: 'Coco' },
    body: {
      en: 'Fine granules and the scent that gives the scrub its name.',
      es: 'Gránulos finos y el aroma que da nombre al exfoliante.',
    },
    verified: true,
  },
  {
    key: 'oils',
    name: { en: 'Nourishing oils', es: 'Aceites nutritivos' },
    body: {
      en: 'The base of the body oil, for a soft, non-greasy finish.',
      es: 'La base del aceite corporal, de acabado suave y no graso.',
    },
    verified: false,
  },
  {
    key: 'humectants',
    name: { en: 'Hydrating actives', es: 'Activos hidratantes' },
    body: {
      en: 'What makes the cream absorb quickly and stay comfortable.',
      es: 'Lo que hace que la crema absorba rápido y siga cómoda.',
    },
    verified: false,
  },
];

/* ===========================================================================
   5. "Resultados reales" — franja de beneficios de campaña
   ---------------------------------------------------------------------------
   Reemplaza dos imágenes de flyer de campaña que llevaban el texto incrustado
   en el píxel (no traducía a /en, no era accesible ni indexable, y llevaban un
   QR, un WhatsApp y un dominio que no corresponden a ningún canal verificado
   del sitio — ver LEGAL_TODO.md L13). Los bullets los dio la propietaria de la
   marca directamente para esta sección; no son ingredientes ni porcentajes.
   =========================================================================== */
export const CAMPAIGN_BENEFITS: readonly Bilingual[] = [
  { en: 'Deep hydration', es: 'Hidratación profunda' },
  { en: 'Elasticity and firmness', es: 'Elasticidad y firmeza' },
  { en: 'Even tone', es: 'Tono uniforme' },
  { en: 'Visible results', es: 'Resultados visibles' },
];

/* ===========================================================================
   6. Comunidad
   =========================================================================== */
export interface CommunityPhoto {
  readonly src: string;
  readonly alt: Bilingual;
  readonly focal: string;
}

export const COMMUNITY_PHOTOS: readonly CommunityPhoto[] = [
  {
    src: '/images/gaviota/community/comunidad-18.jpg',
    focal: '50% 45%',
    alt: {
      en: 'Five women holding different products from the Gaviota by Lia line',
      es: 'Cinco mujeres mostrando distintos productos de la línea Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-9.jpg',
    focal: '50% 58%',
    alt: {
      en: 'Four women of different skin tones with the Gaviota by Lia product line',
      es: 'Cuatro mujeres de distintos tonos de piel junto a la línea de productos Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-17.jpg',
    focal: '50% 42%',
    alt: {
      en: 'Three women holding the Gaviota by Lia scrub and body oil',
      es: 'Tres mujeres sosteniendo el exfoliante y el aceite Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-11.jpg',
    focal: '50% 50%',
    alt: {
      en: 'Four women posing together with Gaviota by Lia products',
      es: 'Cuatro mujeres posando juntas con productos Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-19.jpg',
    focal: '50% 30%',
    alt: {
      en: 'Woman seated and surrounded by hands holding the Gaviota by Lia product line',
      es: 'Mujer sentada rodeada de manos sosteniendo la línea de productos Gaviota by Lia',
    },
  },
];

/* ===========================================================================
   PLACEHOLDERS VISIBLES
   ---------------------------------------------------------------------------
   El brief pide construir el recorrido completo y, donde no haya contenido
   real, dejar textos "claramente marcados como placeholder".

   Este interruptor los muestra. PONLO A `false` ANTES DE PUBLICAR.
   Ninguna sección de placeholder inventa un testimonio, un nombre ni un
   resultado: solo declara qué dato falta y quién debe aportarlo.
   =========================================================================== */
export const SHOW_PLACEHOLDERS = false;

export const PLACEHOLDER_NOTE: Bilingual = {
  en: '[PLACEHOLDER] This section is built and waiting for real content. It will show verified customer reviews once they exist — no sample testimonials are displayed.',
  es: '[PLACEHOLDER] Esta sección está construida y pendiente de contenido real. Mostrará reseñas verificadas de clientas cuando existan; no se muestran testimonios de ejemplo.',
};
