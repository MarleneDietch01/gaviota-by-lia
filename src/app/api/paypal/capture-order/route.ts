import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { getOrdersController } from '@/lib/paypal/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isSameOriginRequest } from '@/lib/security/origin';

/**
 * Captura el pago tras la aprobación del comprador (paso 2 del flujo).
 *
 * Esto es una confirmación INMEDIATA para no dejar la pantalla del comprador
 * colgada — el webhook (`PAYMENT.CAPTURE.COMPLETED`) es la fuente de verdad
 * definitiva y hace exactamente la misma actualización de forma idempotente,
 * así que si esta petición se pierde (el navegador se cierra a mitad de
 * captura), el webhook igual deja el pedido correcto.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { paypalOrderId } = (body ?? {}) as { paypalOrderId?: unknown };
  if (typeof paypalOrderId !== 'string' || !paypalOrderId) {
    return NextResponse.json({ error: 'missing_paypal_order_id' }, { status: 400 });
  }

  let orders: ReturnType<typeof getOrdersController>;
  try {
    orders = getOrdersController();
  } catch {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();

  try {
    const response = await orders.captureOrder({ id: paypalOrderId });
    const order = response.result;
    const purchaseUnit = order.purchaseUnits?.[0];
    const localOrderId = purchaseUnit?.customId ?? purchaseUnit?.referenceId;
    const capture = purchaseUnit?.payments?.captures?.[0];

    if (!localOrderId) {
      return NextResponse.json({ error: 'missing_order_reference' }, { status: 502 });
    }

    const paid = capture?.status === 'COMPLETED' || order.status === 'COMPLETED';

    await admin
      .from('orders')
      .update({
        order_status: paid ? 'paid' : 'cancelled',
        payment_status: paid ? 'paid' : 'failed',
      })
      .eq('id', localOrderId);

    await admin
      .from('payments')
      .update({
        status: paid ? 'paid' : 'failed',
        ...(paid ? { paid_at: new Date().toISOString() } : {}),
        provider_payment_id: capture?.id ?? paypalOrderId,
      })
      .eq('order_id', localOrderId);

    return NextResponse.json({ paid });
  } catch {
    return NextResponse.json({ error: 'capture_failed' }, { status: 502 });
  }
}
