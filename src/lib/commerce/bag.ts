/**
 * Bolsa y favoritos en cliente.
 *
 * -----------------------------------------------------------------------------
 * ALCANCE DELIBERADO
 *
 * Esto NO es un carrito de comercio. Es la capa de cliente que necesita el botón
 * "Añadir al ritual" para no ser un botón decorativo: persiste la intención de
 * compra en `localStorage` y avisa al header para que actualice el contador.
 *
 * El precio NO se guarda: los importes se recalculan siempre en servidor cuando
 * se conecte el checkout (Fase 5 del plan). Guardar el precio en el navegador
 * sería confiar en un valor que el usuario puede editar.
 *
 * Cuando exista la Server Action de carrito, `addToBag` pasará a llamarla y el
 * resto de la aplicación no se entera: la firma no cambia.
 * -----------------------------------------------------------------------------
 */

const BAG_KEY = 'gaviota.bag.v1';
const FAVORITES_KEY = 'gaviota.favorites.v1';
/** Qué líneas salieron hacia Stripe, para saber cuáles retirar al volver. */
const CHECKOUT_KEY = 'gaviota.bag.pending.v1';

export const BAG_EVENT = 'gaviota:bag';
export const FAVORITES_EVENT = 'gaviota:favorites';

export interface BagLine {
  readonly slug: string;
  readonly quantity: number;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // localStorage puede lanzar en modo privado o con la cuota llena. Que el
    // botón no funcione es aceptable; que reviente la página, no.
    return fallback;
  }
}

function write(key: string, value: unknown, event: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ver comentario en read() */
  }
  window.dispatchEvent(new CustomEvent(event));
}

/* ---------------------------------------------------------------------------
   Suscripción para `useSyncExternalStore`
   ---------------------------------------------------------------------------
   Es la API correcta de React para leer un almacén externo (aquí,
   localStorage) sin romper la hidratación: React usa `getServerSnapshot` en el
   servidor y en el primer render de cliente, y solo después adopta el valor
   real. Evita el patrón `useState(false)` + `useEffect(setState)`, que provoca
   un render en cascada y que el linter de React 19 marca como error.

   Los snapshots devuelven primitivas (number / boolean), así que la comparación
   por valor de React basta y no hace falta cachear referencias.
   --------------------------------------------------------------------------- */

function subscribe(event: string) {
  return (onStoreChange: () => void): (() => void) => {
    window.addEventListener(event, onStoreChange);
    // `storage` cubre los cambios hechos en OTRA pestaña.
    window.addEventListener('storage', onStoreChange);
    return () => {
      window.removeEventListener(event, onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  };
}

export const subscribeBag = subscribe(BAG_EVENT);
export const subscribeFavorites = subscribe(FAVORITES_EVENT);

export function getBag(): BagLine[] {
  return read<BagLine[]>(BAG_KEY, []);
}

export function getBagCount(): number {
  return getBag().reduce((total, line) => total + line.quantity, 0);
}

export function addToBag(slug: string, quantity = 1): void {
  const bag = getBag();
  const existing = bag.find((line) => line.slug === slug);
  const next = existing
    ? bag.map((line) => (line.slug === slug ? { ...line, quantity: line.quantity + quantity } : line))
    : [...bag, { slug, quantity }];

  write(BAG_KEY, next, BAG_EVENT);
}

export function setBagQuantity(slug: string, quantity: number): void {
  const safeQuantity = Math.max(0, Math.min(99, Math.trunc(quantity)));
  const next = safeQuantity === 0
    ? getBag().filter((line) => line.slug !== slug)
    : getBag().map((line) => (line.slug === slug ? { ...line, quantity: safeQuantity } : line));
  write(BAG_KEY, next, BAG_EVENT);
}

export function removeFromBag(slug: string): void {
  write(BAG_KEY, getBag().filter((line) => line.slug !== slug), BAG_EVENT);
}

/**
 * Anota qué se está pagando, justo antes de salir hacia Stripe.
 *
 * La bolsa NO se vacía aquí: si el pago falla o la clienta cancela, tiene que
 * encontrar intacto lo que había elegido. Solo se deja constancia de qué
 * líneas iban en el pedido, para poder retirar exactamente esas —y no las que
 * añadiera en otra pestaña mientras pagaba— cuando vuelva.
 *
 * No emite `BAG_EVENT`: esto no cambia la bolsa, así que nada tiene que
 * repintarse.
 */
export function markCheckoutStarted(slugs: readonly string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECKOUT_KEY, JSON.stringify(slugs));
  } catch {
    /* ver comentario en read() */
  }
}

/**
 * Retira de la bolsa lo que acaba de comprarse. Se llama al volver del pago.
 *
 * Si no hay nada anotado no toca nada: es preferible dejar una bolsa de más
 * que vaciar una que no sabemos atribuir a este pedido.
 *
 * Límite conocido: si la clienta paga y cierra la pestaña en Stripe sin
 * volver, no pasa por aquí y su bolsa se queda llena. El webhook sí sabe que
 * pagó, pero corre en el servidor y `localStorage` es del navegador. Cerrarlo
 * del todo exigiría mover la bolsa a la base de datos.
 *
 * @returns cuántas líneas se retiraron.
 */
export function clearPurchasedLines(): number {
  const pending = read<string[]>(CHECKOUT_KEY, []);
  if (pending.length === 0) return 0;

  const bag = getBag();
  const next = bag.filter((line) => !pending.includes(line.slug));

  if (next.length !== bag.length) write(BAG_KEY, next, BAG_EVENT);

  try {
    window.localStorage.removeItem(CHECKOUT_KEY);
  } catch {
    /* ver comentario en read() */
  }

  return bag.length - next.length;
}

export function getFavorites(): string[] {
  return read<string[]>(FAVORITES_KEY, []);
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const favorites = getFavorites();
  const next = favorites.includes(slug)
    ? favorites.filter((value) => value !== slug)
    : [...favorites, slug];

  write(FAVORITES_KEY, next, FAVORITES_EVENT);
  return next.includes(slug);
}
