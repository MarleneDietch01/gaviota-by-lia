import type { Locale } from '@/lib/i18n';

/**
 * Pares de fotos "antes/después" para `BeforeAfter` (home).
 *
 * VACÍO A PROPÓSITO. No hay fotografía real ni consentida todavía — ver el
 * comentario de `home.beforeAfter` en `src/lib/content/sections.ts`. Dos
 * intentos de poblar esta sección con imágenes generadas por IA fueron
 * rechazados en la sesión donde se construyó esta estructura: no se repite
 * ese error. Cuando exista fotografía real, con consentimiento explícito de
 * la persona fotografiada, mismo encuadre e iluminación en ambas tomas, y
 * copy revisado contra `docs/LEGAL_TODO.md`/`CONTENT_TODO.md`, se añade aquí
 * Y se cambia `home.beforeAfter.status` a `'active'` en `sections.ts` — las
 * dos cosas, no una sola.
 */
export interface BeforeAfterItem {
  readonly beforeImage: string;
  readonly afterImage: string;
  readonly alt: { readonly en: string; readonly es: string };
}

export function getBeforeAfterItems(_locale: Locale): readonly BeforeAfterItem[] {
  return [];
}
