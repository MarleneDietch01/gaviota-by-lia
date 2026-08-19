/**
 * Une clases condicionalmente.
 *
 * -----------------------------------------------------------------------------
 * SIGUE SIN USAR `tailwind-merge`, Y AHORA ES SEGURO.
 *
 * La versión anterior llevaba este mismo comentario, pero la premisa era falsa:
 * el sistema SÍ generaba clases en conflicto, y como `cn` solo concatena, ganaba
 * el orden del CSS compilado y no el del `className`. Dos gestos de marca
 * quedaron muertos por eso:
 *
 *   · `frame-organic rounded-card` -> `rounded-card` pisaba las esquinas del
 *     marco orgánico y todas salían a 4px.
 *   · `<Section className="py-0">` -> el `py-28` de la base ganaba y la sección
 *     full-bleed se quedaba con 112px de banda arriba y abajo.
 *
 * La solución adoptada NO es añadir la dependencia, sino eliminar el conflicto
 * en origen:
 *
 *   1. Toda variación estructural de un componente pasa por una PROP tipada
 *      (`<Section padding="none" tone="wine">`), nunca por `className`. La prop
 *      elige una única clase de un mapa, así que no hay dos reglas compitiendo.
 *   2. `className` queda para lo aditivo (posicionamiento, `col-span`, ids de
 *      test). Si necesitas cambiar algo que ya controla una prop, añade un valor
 *      a la prop; no lo sobrescribas desde fuera.
 *   3. `frame-arch` declara las CUATRO esquinas, así que ya no depende de que
 *      ninguna otra utilidad de radio llegue después.
 *
 * Esto mantiene el bundle igual y hace el conflicto imposible de reintroducir
 * sin saltarse el tipo.
 * -----------------------------------------------------------------------------
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
