import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { cents } from '@/lib/commerce/money';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  validate: vi.fn(), shipping: vi.fn(), pending: vi.fn(), coupon: vi.fn(), create: vi.fn(),
  update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
}));
vi.mock('@/lib/commerce/checkout', () => ({ validateCheckoutLines: mocks.validate, computeShipping: mocks.shipping, createPendingOrder: mocks.pending }));
vi.mock('@/lib/stripe/promotion', () => ({ ensureGaviotaCoupon: mocks.coupon }));
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: () => ({ checkout: { sessions: { create: mocks.create } } }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ from: () => ({ update: mocks.update }) }) }));
vi.mock('@/lib/security/rate-limit', () => ({ checkRateLimit: async () => true }));
vi.mock('@/lib/security/origin', () => ({ isSameOriginRequest: () => true }));
import { POST } from '@/app/api/checkout/route';

function request(extra: Record<string, unknown> = {}) {
  return new NextRequest('https://example.com/api/checkout', {
    method: 'POST', body: JSON.stringify({ lines: [{ slug: 'scrub', quantity: 2 }], lang: 'en', ...extra }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validate.mockResolvedValue({ ok: true, result: { subtotal: 8000, items: [{
    productId: 'product', variantId: 'variant', slug: 'scrub', name: 'Body Scrub',
    unitPrice: 4000, quantity: 2, imageUrl: '/images/scrub.jpg',
  }] } });
  mocks.shipping.mockResolvedValue({ shippingCents: 1400, freeShippingApplied: false });
  mocks.pending.mockResolvedValue({ orderId: 'order', orderNumber: 'TEST' });
  mocks.coupon.mockResolvedValue('gaviota10-products-v1');
  mocks.create.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' });
});

describe('checkout promotion contract', () => {
  it('stores the discounted pending order and payment using the existing totals constraint', async () => {
    const { createPendingOrder } = await vi.importActual<typeof import('@/lib/commerce/checkout')>('@/lib/commerce/checkout');
    const writes: Record<string, Record<string, unknown>> = {};
    const admin = { from: (table: string) => ({ insert: (values: Record<string, unknown>) => {
      writes[table] = values;
      return {
        error: null,
        select: () => ({ single: async () => ({ error: null, data: { id: 'order', order_number: 'TEST' } }) }),
      };
    } }) } as unknown as SupabaseClient<Database>;
    const result = await createPendingOrder(admin, {
      email: 'test@example.com', items: [], subtotal: cents(8000), shipping: cents(1400),
      discount: cents(800), promotionCode: 'GAVIOTA10', provider: 'stripe', idempotencyKey: 'test', locale: 'en',
    });
    expect(result).toMatchObject({ grandTotal: 8600 });
    expect(writes.orders).toMatchObject({ subtotal: 8000, discount_total: 800, shipping_total: 1400, grand_total: 8600 });
    expect(writes.payments?.amount).toBe(8600);
  });
  it('discounts server merchandise prices while retaining the separate shipping rate', async () => {
    const response = await POST(request({ promotionCode: ' gaviota10 ', discount: 7999, subtotal: 1 }));
    expect(response.status).toBe(200);
    expect(mocks.pending).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      subtotal: 8000, discount: 800, shipping: 1400, promotionCode: 'GAVIOTA10',
    }));
    const session = mocks.create.mock.calls[0]![0];
    expect(session.discounts).toEqual([{ coupon: 'gaviota10-products-v1' }]);
    expect(session.line_items[0].price_data.unit_amount).toBe(4000);
    expect(session.line_items[0].quantity).toBe(2);
    expect(session.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(1400);
    expect(session.payment_intent_data.metadata.checkout_managed).toBe('true');
    // The pre-discount merchandise subtotal still determines free shipping.
    expect(mocks.shipping).toHaveBeenCalledWith(expect.anything(), 8000);
  });
  it('does not apply a discount without a code', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.coupon).not.toHaveBeenCalled();
    expect(mocks.create.mock.calls[0]![0]).not.toHaveProperty('discounts');
    expect(mocks.pending).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ discount: 0 }));
  });
  it('rejects an invalid code before writing an order', async () => {
    const response = await POST(request({ promotionCode: 'GAVIOTA100' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_promotion_code' });
    expect(mocks.pending).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('fails visibly instead of charging full price when the coupon is unavailable', async () => {
    mocks.coupon.mockRejectedValueOnce(new Error('coupon unavailable'));
    const response = await POST(request({ promotionCode: 'GAVIOTA10' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'promotion_not_available' });
    expect(mocks.pending).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('retains the coupon when the existing Stripe Tax fallback retries the session', async () => {
    mocks.create.mockRejectedValueOnce(new Error('Tax configuration missing'));
    expect((await POST(request({ promotionCode: 'GAVIOTA10' }))).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create.mock.calls[1]![0].discounts).toEqual([{ coupon: 'gaviota10-products-v1' }]);
  });
});
