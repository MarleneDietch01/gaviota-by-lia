import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { cents } from '@/lib/commerce/money';
import { parsePromotionCode, promotionDiscount } from '@/lib/commerce/promotion';

vi.mock('server-only', () => ({}));
import { ensureGaviotaCoupon } from '@/lib/stripe/promotion';
import { buildCustomerReceiptEmail } from '@/lib/email/order-receipt-template';

describe('GAVIOTA10', () => {
  it.each(['GAVIOTA10', 'gaviota10', ' GaViOtA10 '])('accepts %s', (value) => {
    expect(parsePromotionCode(value)).toEqual({ ok: true, code: 'GAVIOTA10' });
  });
  it.each([undefined, null, '', '  '])('allows checkout without a code (%s)', (value) => {
    expect(parsePromotionCode(value)).toEqual({ ok: true, code: null });
  });
  it.each(['GAVIOTA100', 'GAVIOTA 10', ['GAVIOTA10'], { code: 'GAVIOTA10' }, 10, 'x'.repeat(65)])('rejects invalid input %s', (value) => {
    expect(parsePromotionCode(value)).toEqual({ ok: false, error: 'invalid_promotion_code' });
  });
  it('discounts merchandise in integer cents, including quantities and fractional cents', () => {
    expect(promotionDiscount(cents(10000))).toBe(1000);
    expect(promotionDiscount(cents(4000 * 3))).toBe(1200);
    expect(promotionDiscount(cents(4995))).toBe(500);
    expect(promotionDiscount(cents(0))).toBe(0);
  });
  it('includes the discount separately from shipping in the receipt', () => {
    const { html } = buildCustomerReceiptEmail({
      orderNumber: 'TEST', customerEmail: 'test@example.com', customerPhone: null,
      createdAt: '2026-09-11T12:00:00Z', subtotal: cents(8000), discountTotal: cents(800),
      shippingTotal: cents(1400), taxTotal: cents(0), grandTotal: cents(8600),
    }, [], null, 'en');
    expect(html).toContain('Discount');
    expect(html).toContain('-$8.00');
    expect(html).toContain('$14.00');
    expect(html).toContain('$86.00');
  });
});

describe('Stripe coupon provisioning', () => {
  const coupon = { id: 'gaviota10-products-v1', valid: true, percent_off: 10, amount_off: null };
  const retrieve = vi.fn();
  const create = vi.fn();
  const stripe = { coupons: { retrieve, create } } as unknown as Stripe;
  beforeEach(() => { vi.resetAllMocks(); retrieve.mockResolvedValue(coupon); create.mockResolvedValue(coupon); });

  it('reuses the existing valid coupon', async () => {
    expect(await ensureGaviotaCoupon(stripe)).toBe(coupon.id);
    expect(create).not.toHaveBeenCalled();
  });
  it('creates a reusable 10% coupon only when missing', async () => {
    retrieve.mockRejectedValueOnce({ code: 'resource_missing' });
    expect(await ensureGaviotaCoupon(stripe)).toBe(coupon.id);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ percent_off: 10, duration: 'once' }), expect.objectContaining({ idempotencyKey: expect.any(String) }));
  });
  it('handles concurrent creation without dropping the discount', async () => {
    retrieve.mockRejectedValueOnce({ code: 'resource_missing' });
    create.mockRejectedValueOnce(new Error('already exists'));
    expect(await ensureGaviotaCoupon(stripe)).toBe(coupon.id);
  });
  it.each([{ valid: false }, { percent_off: 20 }, { amount_off: 1000 }, { applies_to: { products: ['unrelated'] } }])('refuses a mismatched coupon %s', async (override) => {
    retrieve.mockResolvedValue({ ...coupon, ...override });
    await expect(ensureGaviotaCoupon(stripe)).rejects.toThrow('promotion_not_available');
  });
  it('does not treat an API outage as a missing coupon', async () => {
    retrieve.mockRejectedValue(new Error('network unavailable'));
    await expect(ensureGaviotaCoupon(stripe)).rejects.toThrow('network unavailable');
    expect(create).not.toHaveBeenCalled();
  });
});
