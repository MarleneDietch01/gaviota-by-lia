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
  /** Packshot con la etiqueta en inglés, cuando existe. Solo se usa en `en`. */
  readonly imageEn?: string;
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
    imageEn: '/images/gaviota/products/aceite-anti-estrias-en.png',
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
    imageEn: '/images/gaviota/products/exfoliante-de-coco-en.png',
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
  /** `contain` + `bg`: para un packshot de estudio en vez de una foto de estilo
   *  de vida a sangre (ver nota de la Fase 3 más abajo). Por defecto `cover`. */
  readonly fit?: 'cover' | 'contain';
  readonly bg?: string;
}

/**
 * FASE 3 — Mapeo aprobado de ritual, agosto 2026.
 *
 * Las rutas y las mayúsculas son contractuales. Se inspeccionaron visualmente
 * antes de asignarlas; no se mueven ni renombran los archivos:
 *   · modelo3.png → Exfoliate → Coconut Body Scrub
 *   · Modelo5.png → Hydrate → Hydrating Body Cream
 *   · Modelo4.png → Nourish → Stretch Mark Body Oil
 */
export const RITUAL_STEPS: readonly RitualStep[] = [
  {
    n: '01',
    verb: { en: 'Exfoliate', es: 'Exfolia' },
    body: {
      en: 'Massage onto damp skin using gentle circular motions, then rinse thoroughly.',
      es: 'Masajea sobre la piel húmeda con movimientos circulares suaves y luego enjuaga completamente.',
    },
    product: { en: 'Coconut Body Scrub', es: 'Exfoliante de Coco' },
    href: '/products/exfoliante-de-coco',
    image: '/images/gaviota/products/modelo3.png',
    focal: '50% 50%',
    alt: {
      en: 'Woman applying Gaviota by Lia Coconut Body Scrub to her leg',
      es: 'Mujer aplicando el exfoliante corporal de coco de Gaviota by Lia en su pierna.',
    },
  },
  {
    n: '02',
    verb: { en: 'Hydrate', es: 'Hidrata' },
    body: {
      en: 'Smooth onto clean skin and massage gently until fully absorbed.',
      es: 'Aplica sobre la piel limpia y masajea suavemente hasta que se absorba por completo.',
    },
    product: { en: 'Hydrating Body Cream', es: 'Crema Hidratante' },
    href: '/products/crema-hidratante',
    image: '/images/gaviota/products/Modelo5.png',
    focal: '50% 48%',
    alt: {
      en: 'Woman applying Gaviota by Lia Hydrating Body Cream to her upper arm.',
      es: 'Mujer aplicando la crema corporal hidratante de Gaviota by Lia en su brazo.',
    },
  },
  {
    n: '03',
    verb: { en: 'Nourish', es: 'Nutre' },
    body: {
      en: 'Massage a few drops onto clean skin, focusing on areas that need extra care.',
      es: 'Masajea unas gotas sobre la piel limpia, especialmente en las zonas que necesitan mayor cuidado.',
    },
    product: { en: 'Stretch Mark Body Oil', es: 'Aceite Anti-Estrías' },
    href: '/products/aceite-anti-estrias',
    image: '/images/gaviota/products/Modelo4.png',
    focal: '50% 48%',
    alt: {
      en: 'Woman applying Gaviota by Lia Stretch Mark Body Oil to her forearm with a dropper.',
      es: 'Mujer aplicando el aceite antiestrías de Gaviota by Lia en su antebrazo con un gotero.',
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
export interface CampaignBenefit {
  readonly title: Bilingual;
  readonly body: Bilingual;
}

export const CAMPAIGN_BENEFITS: readonly CampaignBenefit[] = [
  {
    title: { en: 'Deep hydration', es: 'Hidratación profunda' },
    body: {
      en: 'Cream and body oils help keep skin feeling hydrated and comfortable.',
      es: 'La crema y los aceites corporales ayudan a mantener la piel hidratada y cómoda.',
    },
  },
  {
    title: { en: 'Everyday softness', es: 'Suavidad diaria' },
    body: {
      en: 'Cream and scrub support softer, smoother-feeling skin.',
      es: 'La crema y el exfoliante favorecen una piel de sensación más suave y lisa.',
    },
  },
  {
    title: { en: 'Firming body care', es: 'Cuidado corporal reafirmante' },
    body: {
      en: 'The body oil pairs moisturizing care with a luminous-looking finish.',
      es: 'El aceite corporal combina cuidado hidratante con un acabado de apariencia luminosa.',
    },
  },
];

/* ===========================================================================
   6. Comunidad
   =========================================================================== */
export interface CommunityPhoto {
  readonly src: string;
  readonly alt: Bilingual;
}

export const COMMUNITY_PHOTOS: readonly CommunityPhoto[] = [
  {
    src: '/images/gaviota/community/comunidad-18.jpg',
    alt: {
      en: 'Four women showing different products from the Gaviota by Lia line',
      es: 'Cuatro mujeres mostrando distintos productos de la línea Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-9.jpg',
    alt: {
      en: 'Four women of different skin tones with the Gaviota by Lia line',
      es: 'Cuatro mujeres de distintos tonos de piel junto a la línea Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-17.jpg',
    alt: {
      en: 'Three women holding Gaviota by Lia body-care products',
      es: 'Tres mujeres sosteniendo productos de cuidado corporal Gaviota by Lia',
    },
  },
  {
    src: '/images/gaviota/community/comunidad-11.jpg',
    alt: {
      en: 'Three women posing together with Gaviota by Lia products',
      es: 'Tres mujeres posando juntas con productos Gaviota by Lia',
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
