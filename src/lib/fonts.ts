import { Cormorant_Garamond, Manrope } from 'next/font/google';

/**
 * Dos familias. Ni una más.
 *
 * Cormorant Garamond para títulos: su contraste alto y su itálica dan el
 * registro de revista sin resultar rígida. Bodoni sería demasiado severa;
 * Playfair, demasiado vista.
 *
 * Manrope para interfaz: geométrica y cálida, con cifras tabulares para los
 * precios. Inter es excelente pero neutra hasta lo anónimo.
 *
 * Subconjunto `latin-ext` además de `latin`: el sitio es en español y necesita
 * acentos y `ñ`. Sin `latin-ext`, "Anti-Estrías" cae a la fuente de respaldo
 * justo en la tilde.
 */

export const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const fontVariables = `${cormorant.variable} ${manrope.variable}`;
