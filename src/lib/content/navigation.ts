import type { Locale } from '@/lib/i18n';

/**
 * Navegación y textos de chrome (header, drawer, footer).
 *
 * Antes vivían como mapas `Record<string,string>` en línea dentro del JSX, con
 * la cadena en español haciendo de clave. Eso obligaba a editar dos sitios por
 * cada cambio y rompía la traducción en silencio en cuanto alguien corregía una
 * tilde. Aquí cada entrada lleva sus dos idiomas juntos.
 */

export interface NavItem {
  readonly href: string;
  readonly en: string;
  readonly es: string;
}

export function label(item: NavItem, locale: Locale): string {
  return locale === 'es' ? item.es : item.en;
}

/** Navegación principal de escritorio. Cuatro entradas: más se vuelve un menú. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { href: '/shop', en: 'Shop', es: 'Tienda' },
  { href: '/rituals', en: 'Rituals', es: 'Rituales' },
  { href: '/sets', en: 'Sets', es: 'Kits' },
  { href: '/our-story', en: 'Our story', es: 'Nuestra historia' },
];

/** Categorías: solo en el drawer, donde hay sitio para la lista larga. */
export const CATEGORY_NAV: readonly NavItem[] = [
  { href: '/shop', en: 'All products', es: 'Todos los productos' },
  { href: '/categories/aceites-y-serums', en: 'Oils & serums', es: 'Aceites y sérums' },
  { href: '/categories/cremas-e-hidratacion', en: 'Creams & hydration', es: 'Cremas e hidratación' },
  { href: '/categories/exfoliacion', en: 'Exfoliation', es: 'Exfoliación' },
  { href: '/ingredients', en: 'Ingredients', es: 'Ingredientes' },
];

export const BRAND_NAV: readonly NavItem[] = [
  { href: '/our-story', en: 'Our story', es: 'Nuestra historia' },
  { href: '/founder', en: 'Our founder', es: 'La fundadora' },
  { href: '/rituals', en: 'Rituals', es: 'Rituales' },
  { href: '/journal', en: 'Journal', es: 'Diario' },
];

export const HELP_NAV: readonly NavItem[] = [
  { href: '/contact', en: 'Contact', es: 'Contacto' },
  { href: '/faq', en: 'FAQ', es: 'Preguntas frecuentes' },
  { href: '/track-order', en: 'Track my order', es: 'Seguir mi pedido' },
  { href: '/account', en: 'My account', es: 'Mi cuenta' },
];

export const LEGAL_NAV: readonly NavItem[] = [
  { href: '/shipping-policy', en: 'Shipping', es: 'Envíos' },
  { href: '/refund-policy', en: 'Returns', es: 'Devoluciones' },
  { href: '/privacy-policy', en: 'Privacy', es: 'Privacidad' },
  { href: '/terms', en: 'Terms', es: 'Términos' },
  { href: '/cookies', en: 'Cookies', es: 'Cookies' },
];

/** Accesos de cuenta. Se repiten en el drawer porque ahí no hay iconos. */
export const ACCOUNT_NAV: readonly NavItem[] = [
  { href: '/account', en: 'My account', es: 'Mi cuenta' },
  { href: '/wishlist', en: 'Favorites', es: 'Favoritos' },
  { href: '/cart', en: 'Bag', es: 'Bolsa' },
];
