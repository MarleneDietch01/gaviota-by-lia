/**
 * Qué pasa con el inventario cuando Stripe no devuelve una sesión.
 *
 * `/api/checkout` crea el pedido en `pending_payment` y RESERVA inventario
 * antes de hablar con Stripe: el webhook necesita un `order_id` al que atarse.
 * Si la llamada a Stripe falla después de eso, la reserva ya está hecha.
 *
 * Cancelar el pedido sin soltarla la deja retenida para siempre:
 * `expire_stale_reservations()` solo recorre filas que siguen en
 * `pending_payment`, así que el cron nocturno no vuelve a mirar un pedido ya
 * marcado `cancelled`, y no hay ningún trigger en `orders` que lo compense.
 * El daño es silencioso — un producto que aparece agotado sin que falte una
 * sola unidad física.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  rpc: vi.fn(),
  writes: [] as { table: string; values: Record<string, unknown> }[],
  // Filas devueltas por el UPDATE condicionado de `orders`.
  // Vacío = el pedido ya no estaba en `pending_payment`.
  cancelledRows: [{ id: 'order' }] as { id: string }[],
}));

vi.mock('@/lib/commerce/checkout', () => ({
  validateCheckoutLines: async () => ({
    ok: true,
    result: {
      subtotal: 8000,
      items: [{
        productId: 'product', variantId: 'variant', slug: 'scrub', name: 'Body Scrub',
        unitPrice: 4000, quantity: 2, imageUrl: '/images/scrub.jpg',
      }],
    },
  }),
  computeShipping: async () => ({ shippingCents: 1400, freeShippingApplied: false }),
  createPendingOrder: async () => ({ orderId: 'order', orderNumber: 'TEST' }),
}));
vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: () => ({ checkout: { sessions: { create: mocks.create } } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc: mocks.rpc,
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => {
        mocks.writes.push({ table, values });
        const result =
          table === 'orders'
            ? { data: mocks.cancelledRows, error: null }
            : { data: null, error: null };
        const chain = {
          eq: () => chain,
          select: async () => result,
          then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
        };
        return chain;
      },
    }),
  }),
}));
vi.mock('@/lib/security/rate-limit', () => ({ checkRateLimit: async () => true }));
vi.mock('@/lib/security/origin', () => ({ isSameOriginRequest: () => true }));

import { POST } from '@/app/api/checkout/route';

const request = () =>
  new NextRequest('https://example.com/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ lines: [{ slug: 'scrub', quantity: 2 }], lang: 'en' }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.writes.length = 0;
  mocks.cancelledRows = [{ id: 'order' }];
  mocks.rpc.mockResolvedValue({ data: 1, error: null });
  // Falla también el reintento sin impuesto automático: el mensaje no menciona
  // "tax", así que el `catch` interno lo relanza en vez de reintentar.
  mocks.create.mockRejectedValue(new Error('Stripe is down'));
});

describe('cuando Stripe no devuelve una sesión', () => {
  it('cancela el pedido Y devuelve el stock reservado', async () => {
    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'stripe_session_failed' });

    expect(mocks.writes.find((w) => w.table === 'orders')?.values).toEqual({
      order_status: 'cancelled',
      payment_status: 'cancelled',
    });

    // Lo que de verdad importa: sin esto la reserva se queda retenida y no hay
    // nada más abajo en el sistema que la libere.
    expect(mocks.rpc).toHaveBeenCalledWith('release_reservation', {
      p_order_id: 'order',
    });
  });

  it('no suelta la reserva si el pedido ya no estaba pendiente', async () => {
    // `release_reservation()` RESTA `reserved_quantity` y no es idempotente:
    // una segunda pasada se comería la reserva de otro pedido con la misma
    // variante. El UPDATE condicionado es el cerrojo.
    mocks.cancelledRows = [];

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.writes.some((w) => w.table === 'payments')).toBe(false);
  });
});
