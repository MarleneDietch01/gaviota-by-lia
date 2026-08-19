'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Check, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { pick, type Locale } from '@/lib/i18n';
import { addToBag, isFavorite, subscribeFavorites, toggleFavorite } from '@/lib/commerce/bag';

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
}: {
  slug: string;
  productName: string;
  locale: Locale;
}) {
  const [added, setAdded] = useState(false);

  // La confirmación vuelve a su estado normal sola. Sin esto, la tarjeta se
  // queda con "Añadido" para siempre y deja de ser accionable visualmente.
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(timer);
  }, [added]);

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
            ? pick(locale, `${productName} added to your ritual`, `${productName} añadido a tu ritual`)
            : pick(locale, `Add ${productName} to your ritual`, `Añadir ${productName} a tu ritual`)
        }
        className={cn(
          'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xs px-4',
          'text-[0.8125rem] font-semibold tracking-[0.02em]',
          'transition-colors duration-300 ease-soft',
          // Borde a 0.55 y no a 0.25: sobre la tarjeta marfil el trazo anterior
          // quedaba casi invisible y la acción principal de la tarjeta no se
          // leía como acción. El hover pasa a vino de marca en vez de a tinta
          // neutra — el cambio es inequívoco y sigue siendo de la paleta.
          added
            ? 'bg-success text-white-warm'
            : 'border border-ink/55 text-ink hover:border-rose-deep hover:bg-rose-deep hover:text-on-dark',
        )}
      >
        {added ? (
          <Check className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Plus className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span aria-hidden="true">
          {added
            ? pick(locale, 'Added', 'Añadido')
            : pick(locale, 'Add to ritual', 'Añadir al ritual')}
        </span>
      </button>

      {/* Región viva: anuncia el resultado sin mover el foco. */}
      <span role="status" aria-live="polite" className="sr-only">
        {added
          ? pick(locale, `${productName} added to your ritual`, `${productName} añadido a tu ritual`)
          : ''}
      </span>
    </>
  );
}

export function FavoriteToggle({
  slug,
  productName,
  locale,
}: {
  slug: string;
  productName: string;
  locale: Locale;
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
      // Acción SECUNDARIA a propósito: borde más tenue que el de "añadir al
      // ritual" y sin relleno en reposo. La jerarquía entre los dos botones se
      // sostiene en el peso del trazo, no en el tamaño.
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-xs border transition-colors duration-300 ease-soft',
        active
          ? 'border-rose bg-rose/10 text-rose'
          : 'border-ink/30 text-body hover:border-rose hover:text-rose',
      )}
    >
      <Heart className={cn('size-4', active && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
