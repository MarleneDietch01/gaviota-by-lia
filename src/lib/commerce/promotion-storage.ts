import { parsePromotionCode } from '@/lib/commerce/promotion';

const KEY = 'gaviota.promotion.v1';
const EVENT = 'gaviota:promotion';
// Keep the current visit usable if the browser blocks localStorage.
let memoryCode: string | null = null;

export function getSavedPromotion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const result = parsePromotionCode(window.localStorage.getItem(KEY));
    return result.ok ? result.code : null;
  } catch {
    return memoryCode;
  }
}

export function savePromotion(code: string | null): void {
  if (typeof window === 'undefined') return;
  const result = parsePromotionCode(code);
  memoryCode = result.ok ? result.code : null;
  try {
    if (memoryCode) window.localStorage.setItem(KEY, memoryCode);
    else window.localStorage.removeItem(KEY);
  } catch {
    // The in-memory value still works during client-side navigation.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribePromotion(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/* --- El cupón de bienvenida -------------------------------------------------
   Marca de "ya lo vio", separada del código guardado: cerrarlo no debe borrar
   un descuento activado, y activarlo no debe volver a abrirlo.                */
const SEEN_KEY = 'gaviota.promotion.coupon-seen.v1';
let memorySeen = false;

export function wasPromoCouponSeen(): boolean {
  // En servidor se responde "visto": el cupón solo lo decide el cliente.
  if (typeof window === 'undefined') return true;
  if (memorySeen) return true;
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return memorySeen;
  }
}

export function markPromoCouponSeen(): void {
  if (typeof window === 'undefined') return;
  memorySeen = true;
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Con la marca en memoria basta para no repetirlo durante esta visita.
  }
}
