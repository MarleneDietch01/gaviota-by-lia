import 'server-only';
import type { Locale } from '@/lib/i18n';

/**
 * Contenido editable del sitio.
 *
 * -----------------------------------------------------------------------------
 * ESTADO: leyendo de los valores por defecto.
 *
 * La lectura real de `content_sections` se conecta en cuanto exista el proyecto
 * Supabase. La firma de `getSection()` no cambiará: solo su implementación.
 *
 * Los textos de abajo son los APROBADOS en la Fase 2. No son texto de relleno
 * ni lorem ipsum: son el contenido real que la propietaria editará después
 * desde /admin/content.
 * -----------------------------------------------------------------------------
 */

export interface ContentSection {
  readonly key: string;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly buttonLabel?: string;
  readonly buttonUrl?: string;
  /** 'draft' => NO se renderiza. Es el interruptor de las secciones sin datos. */
  readonly status: 'draft' | 'active';
}

const DEFAULTS_ES: Record<string, ContentSection> = {
  'home.announcement': {
    key: 'home.announcement',
    title: 'Envíos con seguimiento en todos los pedidos',
    status: 'active',
  },

  'home.hero': {
    key: 'home.hero',
    eyebrow: 'Cuidado corporal inspirado en la belleza dominicana',
    title: 'Tu piel. Tu ritual. Tu momento.',
    body: 'Cuidado corporal creado para hidratar, suavizar y convertir cada aplicación en un momento para ti.',
    buttonLabel: 'Descubrir la colección',
    buttonUrl: '/shop',
    status: 'active',
  },

  'home.bestsellers': {
    key: 'home.bestsellers',
    eyebrow: 'La colección',
    title: 'Los que todas quieren en su rutina.',
    subtitle:
      'Descubre los favoritos que se han convertido en parte del cuidado diario de nuestra comunidad.',
    buttonLabel: 'Ver todos los productos',
    buttonUrl: '/shop',
    status: 'active',
  },

  'home.needs': {
    key: 'home.needs',
    eyebrow: 'Encuentra tu ritual',
    title: '¿Qué quieres cuidar hoy?',
    subtitle: 'Cada piel es distinta. Empieza por lo que hoy te apetece cuidar.',
    status: 'active',
  },

  'home.campaign': {
    key: 'home.campaign',
    eyebrow: 'Exfoliante de Coco',
    title: 'Suavidad que se convierte en ritual.',
    body: 'Gránulos finos de coco y una fragancia que convierte dos minutos en la ducha en el momento más esperado del día.',
    buttonLabel: 'Conocer el producto',
    buttonUrl: '/products/exfoliante-de-coco',
    status: 'active',
  },

  'home.ritual': {
    key: 'home.ritual',
    eyebrow: 'Tres pasos',
    title: 'Tu ritual empieza aquí.',
    subtitle: 'No tiene que ser complicado para sentirse especial.',
    status: 'active',
  },

  'home.kits': {
    key: 'home.kits',
    eyebrow: 'Kits',
    title: 'Tu rutina completa, en un solo kit.',
    subtitle: 'Los tres pasos juntos, listos para empezar.',
    buttonLabel: 'Ver los kits',
    buttonUrl: '/sets',
    status: 'active',
  },

  'home.story': {
    key: 'home.story',
    eyebrow: 'Nuestra historia',
    title: 'Belleza dominicana hecha ritual.',
    body: 'Gaviota by Lia nace de la mano de Marlene Dietsch, dominicana, con la idea de que cuidar la piel puede ser un momento para una misma y no una tarea más.',
    buttonLabel: 'Conocer nuestra historia',
    buttonUrl: '/our-story',
    status: 'active',
  },

  'home.community': {
    key: 'home.community',
    eyebrow: 'Comunidad',
    title: 'Así se vive Gaviota.',
    subtitle:
      'Pieles distintas, tonos distintos, cuerpos distintos. Todos merecen el mismo cuidado.',
    status: 'active',
  },

  'home.newsletter': {
    key: 'home.newsletter',
    eyebrow: 'Newsletter',
    title: 'Únete a la comunidad',
    body: 'Recibe novedades, rituales y lanzamientos antes que nadie.',
    status: 'active',
  },

  // ---------------------------------------------------------------------------
  // OCULTAS EN PRODUCCIÓN
  // ---------------------------------------------------------------------------
  // El sitio actual no tiene NI UNA SOLA reseña, ni material de clientas
  // autorizado. `status: 'draft'` hace que estas secciones no se rendericen.
  // Se activarán solas cuando existan datos reales.
  'home.testimonials': {
    key: 'home.testimonials',
    title: 'Lo que dicen nuestras clientas',
    status: 'draft',
  },
  'home.ugc': {
    key: 'home.ugc',
    title: 'Contenido de la comunidad',
    status: 'draft',
  },
  'home.instagram': {
    key: 'home.instagram',
    title: 'Síguenos en Instagram',
    buttonLabel: 'Ver más en Instagram',
    buttonUrl: 'https://www.instagram.com/gaviotabylia/',
    status: 'draft',
  },
};

const DEFAULTS_EN: Record<string, ContentSection> = {
  'home.announcement': { key: 'home.announcement', title: 'Tracked shipping on every U.S. order', status: 'active' },
  'home.hero': { key: 'home.hero', eyebrow: 'Dominican-inspired body care', title: 'Your skin. Your ritual. Your moment.', body: 'Body care made to hydrate, soften, and turn every application into a moment of your own.', buttonLabel: 'Shop the collection', buttonUrl: '/shop', status: 'active' },
  'home.bestsellers': { key: 'home.bestsellers', eyebrow: 'The collection', title: 'The favorites your routine will love.', subtitle: 'Meet the community favorites made for everyday body care.', buttonLabel: 'Shop all products', buttonUrl: '/shop', status: 'active' },
  'home.needs': { key: 'home.needs', eyebrow: 'Find your ritual', title: 'What does your skin need today?', subtitle: 'Every skin is different. Start with what you want to care for today.', status: 'active' },
  'home.campaign': { key: 'home.campaign', eyebrow: 'Coconut Body Scrub', title: 'Softness, made into a ritual.', body: 'Fine coconut granules and an irresistible scent turn two minutes in the shower into your favorite moment of the day.', buttonLabel: 'Discover the product', buttonUrl: '/products/exfoliante-de-coco', status: 'active' },
  'home.ritual': { key: 'home.ritual', eyebrow: 'Three steps', title: 'Your ritual starts here.', subtitle: 'It does not have to be complicated to feel special.', status: 'active' },
  'home.kits': { key: 'home.kits', eyebrow: 'Sets', title: 'Your complete routine, in one set.', subtitle: 'All three steps, ready when you are.', buttonLabel: 'Shop sets', buttonUrl: '/sets', status: 'active' },
  'home.story': { key: 'home.story', eyebrow: 'Our story', title: 'Dominican beauty, made into ritual.', body: 'Gaviota by Lia was founded by Dominican creator Marlene Dietsch with one belief: caring for your skin should feel like a moment for yourself, never another chore.', buttonLabel: 'Read our story', buttonUrl: '/our-story', status: 'active' },
  'home.community': { key: 'home.community', eyebrow: 'Community', title: 'This is Gaviota.', subtitle: 'Different skin, different tones, different bodies. Everyone deserves thoughtful care.', status: 'active' },
  'home.newsletter': { key: 'home.newsletter', eyebrow: 'Newsletter', title: 'Join our community', body: 'Get new releases, rituals, and launches before anyone else.', status: 'active' },
  'home.testimonials': { key: 'home.testimonials', title: 'What our customers say', status: 'draft' },
  'home.ugc': { key: 'home.ugc', title: 'From our community', status: 'draft' },
  'home.instagram': { key: 'home.instagram', title: 'Follow us on Instagram', buttonLabel: 'See more on Instagram', buttonUrl: 'https://www.instagram.com/gaviotabylia/', status: 'draft' },
};

/**
 * Devuelve una sección, o `null` si no existe o no está activa.
 *
 * Devolver `null` en lugar de un objeto vacío es lo que permite a los
 * componentes hacer `if (!section) return null` y cumplir sin esfuerzo la regla
 * de no publicar bloques vacíos ni contenido de demostración.
 */
export async function getSection(key: string, locale: Locale = 'en'): Promise<ContentSection | null> {
  const section = (locale === 'es' ? DEFAULTS_ES : DEFAULTS_EN)[key];

  if (!section || section.status !== 'active') {
    return null;
  }

  return section;
}
