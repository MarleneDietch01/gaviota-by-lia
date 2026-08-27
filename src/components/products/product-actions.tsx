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
          'transition-colors duration-300 ease-soft',
          shape,
          added
            ? 'bg-success text-white-warm'
            : variant === 'solid'
              ? // Acción principal a ancho completo (tarjeta de producto):
                // vino sólido, igual receta que `Button` variant="primary".
                'bg-rose text-white-warm hover:bg-rose-deep active:bg-rose-ink'
              : // Borde a 0.55 y no a 0.25: sobre la tarjeta marfil el trazo
                // anterior quedaba casi invisible y la acción principal de la
                // tarjeta no se leía como acción. El hover pasa a vino de marca
                // en vez de a tinta neutra — el cambio es inequívoco y sigue
                // siendo de la paleta.
                'border border-ink/55 text-ink hover:border-rose-deep hover:bg-rose-deep hover:text-on-dark',
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
        'grid size-11 shrink-0 place-items-center transition-colors duration-300 ease-soft',
        variant === 'overlay'
          ? cn(
              'rounded-pill border backdrop-blur-sm',
              active
                ? 'border-rose bg-white-warm/90 text-rose'
                : 'border-white-warm/70 bg-white-warm/70 text-ink hover:border-rose hover:text-rose',
            )
          : cn(
              'rounded-xs border',
              active
                ? 'border-rose bg-rose/10 text-rose'
                : 'border-ink/30 text-body hover:border-rose hover:text-rose',
            ),
        className,
      )}
    >
      <Heart className={cn('size-4', active && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
