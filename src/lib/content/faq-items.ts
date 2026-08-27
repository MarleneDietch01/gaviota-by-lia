import type { Locale } from '@/lib/i18n';

/**
 * Preguntas y respuestas para `Faq` (home) y, eventualmente, `/faq`.
 *
 * VACÍO A PROPÓSITO. `/faq` hoy es un párrafo genérico que explica que las
 * respuestas dependen de políticas aprobadas todavía por confirmar (ver
 * `home.faq` en `src/lib/content/sections.ts` y la entrada `faq` en
 * `src/lib/content/route-pages.ts`). No se inventan preguntas ni respuestas
 * de relleno. Cuando existan Q&A reales, se añaden aquí Y se cambia
 * `home.faq.status` a `'active'` en `sections.ts`.
 */
export interface FaqItem {
  readonly question: { readonly en: string; readonly es: string };
  readonly answer: { readonly en: string; readonly es: string };
}

export function getFaqItems(_locale: Locale): readonly FaqItem[] {
  return [];
}
