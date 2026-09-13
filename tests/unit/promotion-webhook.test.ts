import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  construct: vi.fn(), list: vi.fn(), receipt: vi.fn(), rpc: vi.fn(),
  writes: [] as { table: string; values: Record<string, unknown> }[],
  failOrders: false,
}));
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: () => ({
  webhooks: { constructEvent: mocks.construct }, checkout: { sessions: { list: mocks.list } },
}) }));
vi.mock('@/lib/email/order-confirmation', () => ({ sendOrderConfirmationEmails: mocks.receipt }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({
  rpc: mocks.rpc,
  from: (table: string) => {
    const chain = {
      eq: () => chain,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: table === 'orders' && mocks.failOrders ? new Error('totals rejected') : null }).then(resolve),
    };
    return {
      insert: async () => ({ error: null }),
      update: (values: Record<string, unknown>) => { mocks.writes.push({ table, values }); return chain; },
    };
  },
}) }));
import { POST } from '@/app/api/webhooks/stripe/route';

const session = {
  id: 'cs_test', metadata: { order_id: 'order' }, currency: 'usd', payment_status: 'paid',
  amount_total: 9104, payment_intent: 'pi_test',
  total_details: { amount_discount: 800, amount_tax: 504, amount_shipping: 1400 },
};
const request = () => new NextRequest('https://example.com/api/webhooks/stripe', {
  method: 'POST', headers: { 'stripe-signature': 'test-signature' }, body: 'signed-event',
});

beforeEach(() => {
  vi.clearAllMocks(); mocks.writes.length = 0; mocks.failOrders = false;
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test-secret');
  mocks.construct.mockReturnValue({ id: 'evt_test', type: 'checkout.session.completed', data: { object: session } });
  mocks.list.mockResolvedValue({ data: [session] });
  mocks.receipt.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('discounted payment confirmation', () => {
  it('persists Stripe discount and tax before issuing the receipt', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.writes.find((write) => write.table === 'orders')?.values).toMatchObject({
      discount_total: 800, tax_total: 504, grand_total: 9104, payment_status: 'paid',
    });
    expect(mocks.writes.find((write) => write.table === 'payments')?.values.amount).toBe(9104);
    expect(mocks.receipt).toHaveBeenCalledOnce();
  });
  it('requests a retry and sends no receipt when totals cannot be saved', async () => {
    mocks.failOrders = true;
    expect((await POST(request())).status).toBe(500);
    expect(mocks.receipt).not.toHaveBeenCalled();
    expect(mocks.writes.at(-1)?.values.processing_status).toBe('failed');
  });
  it('retrieves the session breakdown when PaymentIntent arrives first', async () => {
    mocks.construct.mockReturnValue({ id: 'evt_pi', type: 'payment_intent.succeeded', data: { object: {
      id: 'pi_test', metadata: { order_id: 'order', checkout_managed: 'true' },
    } } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith({ payment_intent: 'pi_test', limit: 1 });
    expect(mocks.writes.find((write) => write.table === 'orders')?.values.discount_total).toBe(800);
    expect(mocks.receipt).toHaveBeenCalledOnce();
  });
  it('waits for a paid session instead of sending an early receipt', async () => {
    mocks.construct.mockReturnValue({ id: 'evt_pi', type: 'payment_intent.succeeded', data: { object: {
      id: 'pi_test', metadata: { order_id: 'order', checkout_managed: 'true' },
    } } });
    mocks.list.mockResolvedValue({ data: [{ ...session, payment_status: 'unpaid' }] });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it('rejects invalid signatures without writing payment data', async () => {
    mocks.construct.mockImplementationOnce(() => { throw new Error('invalid signature'); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.writes).toEqual([]);
  });
});
