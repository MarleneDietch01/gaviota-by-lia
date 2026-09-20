'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowRight, Check, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import {
  addToBag,
  getBagCount,
  isFavorite,
  subscribeBag,
  subscribeFavorites,
  toggleFavorite,
} from '@/lib/commerce/bag';

/**
 * Acciones de la tarjeta de producto.
 *
 * Es el único trozo de cliente de toda la rejilla: la tarjeta y la sección son
 * Server Components. Aquí solo vive lo que necesita estado del navegador.
 *
 * Accesibilidad:
 *   · El nombre accesible incluye el producto, porque en una rejilla de cuatro
 *     "Añadir" a secas no distingue nada para un lector de pantalla.
 *   · La confirmación se anuncia por `aria-live`, no solo con un cambio de
 *     color e icono.
 *   · Favoritos es un toggle con `aria-pressed`: el estado no se comunica solo
 *     con el relleno del corazón.
 */

export function QuickAdd({
  slug,
  productName,
  locale,
  inStock = true,
  variant = 'outline',
}: {
  slug: string;
  productName: string;
  locale: Locale;
  /**
   * `false` cuando `stockAvailable` de la variante principal llegó a 0 (dato
   * real de `product_variants`, no una estimación). Deshabilita el botón y
   * cambia su texto en vez de dejar que "añada" un producto que el checkout
   * rechazará de todas formas.
   */
  inStock?: boolean;
  /** `solid`: acción principal a ancho completo (tarjeta de producto). `outline`
   *  (por defecto): como ya se ve en la ficha de producto, junto a favoritos. */
  variant?: 'outline' | 'solid';
}) {
  const [added, setAdded] = useState(false);

  // La confirmación vuelve a su estado normal sola. Sin esto, la tarjeta se
  // queda con "Añadido" para siempre y deja de ser accionable visualmente.
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(timer);
  }, [added]);

  const shape = variant === 'solid' ? 'w-full' : 'flex-1';

  if (!inStock) {
    // Texto visible en vez de `aria-label`: un `aria-label` distinto del texto
    // que se ve rompería la coincidencia nombre-accesible/texto-visible que
    // exige WCAG 2.1 (2.5.3). El nombre de producto ya lo da el `<h3>`/enlace
    // contiguo de la tarjeta o de la ficha, así que no hace falta repetirlo.
    return (
      <span
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-xs border border-dashed border-line-strong px-4 text-[0.8125rem] font-semibold tracking-[0.02em] text-muted',
          shape,
        )}
      >
        {pick(locale, 'Out of stock', 'Agotado')}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          addToBag(slug);
          setAdded(true);
        }}
        aria-label={
          added
            ? pick(locale, `${productName} added to your bag`, `${productName} añadido a tu bolsa`)
            : pick(locale, `Add ${productName} to your bag`, `Añadir ${productName} a tu bolsa`)
        }
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-xs px-4',
          'text-meta font-semibold tracking-[0.02em]',
          'premium-button overflow-hidden transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-editorial motion-safe:active:scale-[0.98]',
          shape,
          added
            ? 'bg-success text-white-warm'
            : variant === 'solid'
              ? // Acción principal: champán con texto espresso, igual que `Button`.
                'bg-champagne text-ink hover:bg-gold active:bg-gold'
              : // Borde a 0.55 y no a 0.25: sobre la tarjeta marfil el trazo
                // anterior quedaba casi invisible y la acción principal de la
                // tarjeta no se leía como acción. El hover pasa a tinta de marca
                // en vez de a tinta neutra — el cambio es inequívoco y sigue
                // siendo de la paleta.
                'border border-ink/55 text-ink hover:border-ink hover:bg-ink hover:text-on-dark',
        )}
      >
        {added ? (
          <Check className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Plus className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span aria-hidden="true">
          {added ? pick(locale, 'Added', 'Añadido') : pick(locale, 'Add to bag', 'Añadir a la bolsa')}
        </span>
      </button>

      {/* Región viva: anuncia el resultado sin mover el foco. */}
      <span role="status" aria-live="polite" className="sr-only">
        {added
          ? pick(locale, `${productName} added to your bag`, `${productName} añadido a tu bolsa`)
          : ''}
      </span>
    </>
  );
}

/**
 * El paso siguiente después de añadir.
 *
 * Hasta ahora, añadir confirmaba con "Añadido" durante 2,4 s y subía el
 * contador del icono de la cabecera. Eso dice que algo pasó, pero no ofrece a
 * dónde ir: para ver la bolsa había que localizar un icono pequeño arriba a la
 * derecha (auditoría del 2026-09-20).
 *
 * No es un modal ni un panel deslizante: son dos enlaces bajo la acción, y
 * "Seguir comprando" está primero en el DOM a propósito —quien quiera seguir
 * mirando no tiene que pasar por encima de la llamada a la bolsa.
 *
 * Aparece cuando la bolsa deja de estar vacía y SE QUEDA, en lugar de irse con
 * la confirmación a los 2,4 s. Un enlace que desaparece solo es peor que no
 * tenerlo: obliga a actuar deprisa y desaparece justo bajo el puntero.
 *
 * SOLO A PARTIR DE `lg`. Por debajo, `mobile-purchase-bar.tsx` ya cambia
 * "Añadir a la bolsa" por "Ver bolsa" en una barra fija al borde inferior —
 * más visible que esto y sin necesidad de desplazarse. Repetirlo aquí ponía
 * dos "Ver bolsa" en la misma pantalla (medido en el navegador a 390 px). El
 * hueco que describe la auditoría es el de escritorio, donde esa barra es
 * `lg:hidden` y la única señal era el contador del icono de la cabecera.
 */
export function BagNextStep({ locale }: { locale: Locale }) {
  // Mismo patrón que `saved-list.tsx`: el snapshot de servidor es 0, así que
  // el HTML del servidor y el primer render de cliente coinciden y no hay
  // desajuste de hidratación.
  const count = useSyncExternalStore(subscribeBag, getBagCount, () => 0);
  if (count === 0) return null;

  return (
    <div className="mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 text-sm lg:flex">
      <Link
        href={localizedHref(locale, '/shop')}
        className="inline-flex min-h-11 items-center text-body underline underline-offset-4 hover:text-ink"
      >
        {pick(locale, 'Keep shopping', 'Seguir comprando')}
      </Link>
      <Link
        href={localizedHref(locale, '/cart')}
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-gold-deep underline underline-offset-4 hover:text-ink"
      >
        {pick(locale, 'View bag', 'Ver bolsa')}
        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function FavoriteToggle({
  slug,
  productName,
  locale,
  variant = 'inline',
  className,
}: {
  slug: string;
  productName: string;
  locale: Locale;
  /** `overlay`: botón circular flotando sobre una foto (tarjeta de producto),
   *  fondo translúcido con blur en vez del borde sobre superficie plana que
   *  usa `inline` (ficha de producto, junto a "Add to bag"). */
  variant?: 'inline' | 'overlay';
  /** Posicionamiento (`absolute`, etc.): depende de dónde se monte el botón,
   *  no es parte del aspecto propio del componente. */
  className?: string;
}) {
  // `useSyncExternalStore` en lugar de useState + useEffect: el snapshot de
  // servidor es `false`, así que el HTML del servidor y el primer render de
  // cliente coinciden y no hay desajuste de hidratación. Además el corazón se
  // mantiene sincronizado si el mismo producto aparece en dos sitios de la
  // página, o si se cambia desde otra pestaña.
  const active = useSyncExternalStore(
    subscribeFavorites,
    useCallback(() => isFavorite(slug), [slug]),
    () => false,
  );

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={pick(
        locale,
        `Save ${productName} to favorites`,
        `Guardar ${productName} en favoritos`,
      )}
      // Acción SECUNDARIA a propósito: borde más tenue que el de "add to bag"
      // y sin relleno en reposo. La jerarquía entre los dos botones se
      // sostiene en el peso del trazo, no en el tamaño.
      className={cn(
        'favorite-button grid size-11 shrink-0 place-items-center transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-editorial',
        variant === 'overlay'
          ? cn(
              'rounded-pill border backdrop-blur-sm',
              active
                ? 'border-gold-deep bg-white-warm/90 text-gold-deep'
                : 'border-white-warm/70 bg-white-warm/70 text-ink hover:border-gold-deep hover:text-gold-deep',
            )
          : cn(
              'rounded-xs border',
              active
                ? 'border-gold-deep bg-gold-deep/10 text-gold-deep'
                : 'border-ink/30 text-body hover:border-gold-deep hover:text-gold-deep',
            ),
        className,
      )}
    >
      <Heart className={cn('size-4', active && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
