import { cents, type Cents } from '@/lib/commerce/money';

export const GAVIOTA_PROMOTION = { code: 'GAVIOTA10', percentOff: 10 } as const;

/** Shared display rules. Checkout always validates again using server prices. */
export function parsePromotionCode(value: unknown):
  | { ok: true; code: typeof GAVIOTA_PROMOTION.code | null }
  | { ok: false; error: 'invalid_promotion_code' } {
  if (value === undefined || value === null || value === '') return { ok: true, code: null };
  if (typeof value !== 'string' || value.length > 64) return { ok: false, error: 'invalid_promotion_code' };
  const code = value.trim().toUpperCase();
  if (!code) return { ok: true, code: null };
  return code === GAVIOTA_PROMOTION.code
    ? { ok: true, code: GAVIOTA_PROMOTION.code }
    : { ok: false, error: 'invalid_promotion_code' };
}

/** Estimate in integer cents. Stripe confirms the final rounded discount. */
export function promotionDiscount(subtotal: Cents): Cents {
  return cents(Math.round(subtotal * GAVIOTA_PROMOTION.percentOff / 100));
}
