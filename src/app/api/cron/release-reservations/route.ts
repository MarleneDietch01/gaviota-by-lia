import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Cron: caduca los checkouts abandonados.
 *
 * -----------------------------------------------------------------------------
 * QUÉ ES UN "CARRITO ABANDONADO" EN ESTE PROYECTO
 * -----------------------------------------------------------------------------
 * No es una fila de `carts` — esa tabla no la escribe nadie, la bolsa vive en
 * `localStorage` (`lib/commerce/bag.ts`). Es una fila de `orders` en
 * `pending_payment`: `/api/checkout` la crea ANTES de hablar con Stripe porque
 * el webhook necesita un `order_id` al que atarse y porque hay que reservar el
 * inventario en ese mismo instante. Si la compradora cierra la pestaña de
 * Stripe, esa fila se queda ahí — y con ella la reserva de stock.
 *
 * Ese es el daño real, y es silencioso: `reserved_quantity` sube en cada
 * checkout iniciado y no bajaba NUNCA. Un producto con existencias puede
 * acabar mostrándose agotado sin que falte ni una unidad física.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ ESTO ES LA RED, NO EL MECANISMO PRINCIPAL
 * -----------------------------------------------------------------------------
 * El camino normal lo cierra Stripe: la Checkout Session se crea con
 * `expires_at` a 31 minutos y, al vencer, manda `checkout.session.expired` al
 * webhook, que cancela el pedido y suelta la reserva en cuestión de segundos.
 * Esta tarea existe para lo que ese camino no cubre: un evento que Stripe no
 * llegó a entregar, un pedido cuya sesión nunca se creó (fallo entre el INSERT
 * y la llamada a Stripe), o el atasco histórico que ya está en la base.
 *
 * Por eso corre UNA VEZ AL DÍA y no cada pocos minutos: a los 30 minutos el
 * webhook ya hizo el trabajo en el 99% de los casos. Una frecuencia diaria
 * además funciona en cualquier plan de Vercel — los planes Hobby rechazan en
 * el despliegue cualquier cron que se dispare más de una vez al día.
 *
 * -----------------------------------------------------------------------------
 * LO QUE ESTO NO HACE: BORRAR
 * -----------------------------------------------------------------------------
 * Las filas pasan a `cancelled`, no desaparecen. No es una limitación que se
 * pueda sortear: `order_status_history` cuelga de `orders` con ON DELETE
 * CASCADE y tiene un trigger `forbid_mutation()` que rechaza DELETE incluso
 * desde `service_role`; `inventory_movements` hace lo propio con el UPDATE que
 * provocaría su ON DELETE SET NULL. Es el libro mayor contable del inventario,
 * y está blindado a propósito (ver 0017_triggers.sql). El pedido cancelado es
 * el registro honesto de que alguien empezó a comprar y no terminó.
 * -----------------------------------------------------------------------------
 */
async function releaseExpiredReservations(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // Sin secreto configurado NO se abre el endpoint "por comodidad": este
  // handler escribe en `orders` con `service_role`. Falla cerrado.
  if (!secret) {
    console.error('[cron/release-reservations] falta CRON_SECRET');
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  }

  // Vercel Cron manda `Authorization: Bearer <CRON_SECRET>` en un GET. La
  // comparación es de tiempo constante: un `===` filtra por cuánto tarda en
  // fallar cuántos caracteres del prefijo acertó quien lo intenta.
  const provided = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  const authorized =
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes);

  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Todo el trabajo ocurre dentro de `expire_stale_reservations()`, en una
  // sola transacción de Postgres: por cada pedido `pending_payment` vencido
  // devuelve el stock reservado y lo pasa a `cancelled`. Hacerlo aquí, a base
  // de consultas sueltas, dejaría la puerta abierta a soltar la reserva y
  // fallar antes de cancelar el pedido — el peor de los dos estados.
  const { data, error } = await admin.rpc('expire_stale_reservations');

  if (error) {
    console.error('[cron/release-reservations] fallo al caducar reservas:', error);
    return NextResponse.json({ error: 'expiry_failed' }, { status: 500 });
  }

  return NextResponse.json({ expired: data ?? 0 });
}

// Vercel Cron invoca con GET. POST queda para dispararlo a mano (curl con el
// mismo Bearer) sin tener que esperar a la ventana del cron.
export const GET = releaseExpiredReservations;
export const POST = releaseExpiredReservations;
