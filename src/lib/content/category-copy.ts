import type { CategorySlug } from '@/lib/catalog/products';
import type { Locale } from '@/lib/i18n';

// Descriptions are visible on the category page as well as in its metadata.
// Keep claims within the published product descriptions.
export const CATEGORY_COPY: Record<CategorySlug, Record<Locale, { title: string; description: string }>> = {
  'aceites-y-serums': {
    en: {
      title: 'Body Oils & Ingrown Hair Serum',
      description: 'Explore stretch mark body oils for soft, luminous-looking skin and serum for your post-hair-removal routine. Dominican body care with U.S. shipping.',
    },
    es: {
      title: 'Aceites corporales y sérum post-depilación',
      description: 'Descubre aceites para estrías y sérum para tu rutina post-depilación. Cuidado corporal dominicano para una piel suave, con envíos en Estados Unidos.',
    },
  },
  'cremas-e-hidratacion': {
    en: {
      title: 'Hydrating Body Cream',
      description: 'Make daily hydration part of your ritual with Gaviota by Lia body cream for soft-feeling skin. Explore ingredients and how to use it. U.S. shipping.',
    },
    es: {
      title: 'Crema hidratante corporal',
      description: 'Haz de la hidratación un ritual con la crema corporal Gaviota by Lia. Consulta ingredientes y modo de uso para una piel suave. Envíos en Estados Unidos.',
    },
  },
  exfoliacion: {
    en: {
      title: 'Coconut Body Scrub',
      description: 'Discover Gaviota by Lia coconut body scrub for gentle exfoliation with a tropical coconut scent. Explore ingredients and directions. Ships within the USA.',
    },
    es: {
      title: 'Exfoliante corporal de coco',
      description: 'Descubre el exfoliante corporal de coco Gaviota by Lia para una exfoliación suave con aroma tropical. Consulta ingredientes y uso. Envíos en Estados Unidos.',
    },
  },
  'cuidado-masculino': {
    en: {
      title: "Men's Body Oil & Beard Care",
      description: "Explore men's body oil and beard tonic by Gaviota by Lia. Find ingredients and directions for your daily body and beard care ritual. U.S. shipping.",
    },
    es: {
      title: 'Aceite corporal masculino y cuidado de barba',
      description: 'Explora el aceite corporal masculino y el tónico para barba Gaviota by Lia. Consulta ingredientes y uso para tu cuidado diario. Envíos en Estados Unidos.',
    },
  },
};
