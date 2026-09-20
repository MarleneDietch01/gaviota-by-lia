/**
 * Carritos abandonados — el pedido se cancela y el stock vuelve, exactamente
 * una vez.
 *
 * Un "carrito abandonado" aquí es una fila de `orders` en `pending_payment`:
 * `/api/checkout` la crea antes de mandar a Stripe y reserva inventario en ese
 * momento. Si nadie la caduca, la reserva se queda retenida para siempre.
 *
 * Lo que se prueba, y por qué cada cosa:
 *
 *  1. `checkout.session.expired` cancela el pedido y suelta la reserva. Es el
 *     mecanismo principal — sin él, el cron diario sería el único freno.
 *  2. Si el pedido YA no está en `pending_payment`, no se suelta nada. Este es
 *     el caso que de verdad puede hacer daño: `release_reservation()` resta
 *     `reserved_quantity` por variante, así que una segunda llamada no es un
 *     no-op, se come la reserva de OTRO pedido pendiente con la misma
 *     variante. El UPDATE condicionado es el cerrojo, y esto lo verifica.
 *  3. El cron exige el `CRON_SECRET` y, con él, ejecuta la caducidad en la
 *     base. Escribe en `orders` con `service_role`: abrirlo sería regalar un
 *     botón de "cancelar pedidos" a cualquiera.
 *
 * Todo con dobles, sin tocar la base: `order_status_history` es inmutable y
 * un pedido de prueba insertado aquí no se podría borrar después (ver la nota
 * de `checkout.test.ts`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  construct: vi.fn(),
  rpc: vi.fn(),
  writes: [] as { table: string; values: Record<string, unknown> }[],
  // Filas que devuelve el UPDATE condicionado de `orders`. Vacío = el pedido
  // ya no estaba en `pending_payment`.
  cancelledRows: [{ id: 'order-abandonado' }] as { id: string }[],
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mocks.construct },
    checkout: { sessions: { list: vi.fn() } },
  }),
}));
vi.mock('@/lib/email/order-confirmation', () => ({
  sendOrderConfirmationEmails: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc: mocks.rpc,
    from: (table: string) => ({
      insert: async () => ({ error: null }),
      select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
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

import { POST as stripeWebhook } from '@/app/api/webhooks/stripe/route';
import { GET as releaseReservations } from '@/app/api/cron/release-reservations/route';

const expiredSession = {
  id: 'cs_test_abandonado',
  metadata: { order_id: 'order-abandonado' },
  status: 'expired',
};

const webhookRequest = () =>
  new NextRequest('https://example.com/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-signature' },
    body: 'signed-event',
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.writes.length = 0;
  mocks.cancelledRows = [{ id: 'order-abandonado' }];
  mocks.rpc.mockResolvedValue({ data: 0, error: null });
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test-secret');
  vi.stubEnv('CRON_SECRET', 'secreto-de-prueba');
  mocks.construct.mockReturnValue({
    id: 'evt_expired',
    type: 'checkout.session.expired',
    data: { object: expiredSession },
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('checkout.session.expired', () => {
  it('cancela el pedido y devuelve el stock reservado', async () => {
    const response = await stripeWebhook(webhookRequest());
    expect(response.status).toBe(200);

    const orderWrite = mocks.writes.find((w) => w.table === 'orders');
    expect(orderWrite?.values).toEqual({
      order_status: 'cancelled',
      payment_status: 'cancelled',
    });

    expect(mocks.writes.find((w) => w.table === 'payments')?.values).toEqual({
      status: 'cancelled',
    });

    expect(mocks.rpc).toHaveBeenCalledWith('release_reservation', {
      p_order_id: 'order-abandonado',
    });
  });

  it('no suelta la reserva si el pedido ya no estaba pendiente', async () => {
    // Cero filas actualizadas = se pagó entre medias, o `payment_failed` ya lo
    // canceló y ya soltó la reserva. Soltarla otra vez restaría inventario
    // reservado que ahora pertenece a otro pedido.
    mocks.cancelledRows = [];

    const response = await stripeWebhook(webhookRequest());
    expect(response.status).toBe(200);

    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.writes.some((w) => w.table === 'payments')).toBe(false);
  });

  it('ignora el evento si la sesión no lleva order_id', async () => {
    mocks.construct.mockReturnValue({
      id: 'evt_expired_sin_orden',
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_suelta', metadata: {} } },
    });

    const response = await stripeWebhook(webhookRequest());
    expect(response.status).toBe(200);
    expect(mocks.writes.some((w) => w.table === 'orders')).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe('/api/cron/release-reservations', () => {
  const cronRequest = (authorization?: string) =>
    new NextRequest('https://example.com/api/cron/release-reservations', {
      method: 'GET',
      ...(authorization ? { headers: { authorization } } : {}),
    });

  it('rechaza sin el secreto', async () => {
    const response = await releaseReservations(cronRequest());
    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rechaza con un secreto equivocado', async () => {
    const response = await releaseReservations(cronRequest('Bearer otro-secreto'));
    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('caduca las reservas vencidas con el secreto correcto', async () => {
    mocks.rpc.mockResolvedValue({ data: 7, error: null });

    const response = await releaseReservations(cronRequest('Bearer secreto-de-prueba'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ expired: 7 });
    expect(mocks.rpc).toHaveBeenCalledWith('expire_stale_reservations');
  });

  it('falla cerrado si no hay CRON_SECRET configurado', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const response = await releaseReservations(cronRequest('Bearer secreto-de-prueba'));
    expect(response.status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
