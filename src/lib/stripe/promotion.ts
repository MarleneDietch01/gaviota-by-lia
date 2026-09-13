import 'server-only';
import type Stripe from 'stripe';
import { GAVIOTA_PROMOTION } from '@/lib/commerce/promotion';

const COUPON_ID = 'gaviota10-products-v1';

/** One reusable coupon per Stripe account/mode, provisioned on first use. */
export async function ensureGaviotaCoupon(stripe: Stripe): Promise<string> {
  let coupon: Stripe.Coupon;
  try {
    coupon = await stripe.coupons.retrieve(COUPON_ID);
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'resource_missing') throw error;
    try {
      coupon = await stripe.coupons.create({
        id: COUPON_ID,
        name: `${GAVIOTA_PROMOTION.code} · 10%`,
        percent_off: GAVIOTA_PROMOTION.percentOff,
        duration: 'once',
        metadata: { promotion_code: GAVIOTA_PROMOTION.code },
      }, { idempotencyKey: `create-${COUPON_ID}` });
    } catch (createError) {
      // Another request may have created the same fixed ID concurrently.
      // Retrieve and validate it; never silently continue without a discount.
      try { coupon = await stripe.coupons.retrieve(COUPON_ID); }
      catch { throw createError; }
    }
  }

  if (!coupon.valid || coupon.percent_off !== GAVIOTA_PROMOTION.percentOff ||
      coupon.amount_off !== null || coupon.applies_to?.products?.length) {
    throw new Error('promotion_not_available');
  }
  return coupon.id;
}
