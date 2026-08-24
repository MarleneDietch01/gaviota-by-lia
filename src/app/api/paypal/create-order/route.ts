import 'server-only';

import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { getOrdersController } from '@/lib/paypal/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { computeShipping, createPendingOrder, validateCheckoutLines } from '@/lib/commerce/checkout';
import { toUnits } from '@/lib/commerce/money';
import { isSameOriginRequest } from '@/lib/security/origin';
import { parseOptionalCheckoutEmail } from '@/lib/validation/checkout';
import { isLocale, type Locale } from '@/lib/i18n';

/**
 * Crea el pedido de PayPal (paso 1 del flujo de PayPal Buttons).
 *
 * Misma regla que Stripe: el precio se valida SIEMPRE en servidor con
 * `validateCheckoutLines()`, nunca se confía en lo que manda el navegador. La
 * diferencia con Stripe es de flujo, no de seguridad: PayPal Buttons llama
 * primero a este endpoint para obtener un `orderID`, el comprador aprueba en
 * el propio widget de PayPal (sin salir de la página), y solo entonces el
 * cliente llama a `/api/paypal/capture-order` con ese id.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  // Igual que en /api/checkout: se resuelve ANTES de escribir nada en la
  // base, para no dejar pedidos huérfanos si falta la configuración.
  let orders: ReturnType<typeof getOrdersController>;
  try {
    orders = getOrdersController();
  } catch {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { lines, lang, customerEmail } = (body ?? {}) as {
    lines?: unknown;
    lang?: unknown;
    customerEmail?: unknown;
  };

  const locale: Locale = typeof lang === 'string' && isLocale(lang) ? lang : 'es';
  const email = parseOptionalCheckoutEmail(customerEmail);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await checkRateLimit(`checkout:${ip}`, 10, 300);
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const validation = await validateCheckoutLines(lines, locale);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, ...(validation.slugs ? { slugs: validation.slugs } : {}) },
      { status: 400 },
    );
  }

  const { items, subtotal } = validation.result;
  const admin = createAdminSupabaseClient();
  const idempotencyKey = randomUUID();

  // Igual que en /api/checkout: se resuelve antes de crear el pedido, para
  // no dejar uno huérfano si no hay ninguna tarifa de envío configurada.
  let shipping: Awaited<ReturnType<typeof computeShipping>>;
  try {
    shipping = await computeShipping(admin, subtotal);
  } catch (error) {
    console.error('[paypal/create-order] shipping not configured:', error);
    return NextResponse.json({ error: 'shipping_not_configured' }, { status: 503 });
  }

  const pendingOrder = await createPendingOrder(admin, {
    email,
    items,
    subtotal,
    shipping: shipping.shippingCents,
    provider: 'paypal',
    idempotencyKey,
  });

  if ('error' in pendingOrder) {
    return NextResponse.json({ error: pendingOrder.error }, { status: 500 });
  }

  const { orderId, orderNumber, grandTotal } = pendingOrder;

  try {
    const response = await orders.createOrder(
      {
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              referenceId: orderId,
              customId: orderId,
              invoiceId: orderNumber,
              amount: {
                currencyCode: 'USD',
                // `value` es el total que PayPal cobra de verdad; el desglose
                // debajo tiene que sumar exactamente lo mismo o PayPal
                // rechaza la petición (ITEM_TOTAL_MISMATCH). Antes `itemTotal`
                // estaba puesto igual a `grandTotal` completo (bug real,
                // independiente del envío: sobrestimaba el valor de la
                // mercancía en el desglose que ve la clienta en PayPal).
                value: toUnits(grandTotal).toFixed(2),
                breakdown: {
                  itemTotal: { currencyCode: 'USD', value: toUnits(subtotal).toFixed(2) },
                  shipping: { currencyCode: 'USD', value: toUnits(shipping.shippingCents).toFixed(2) },
                },
              },
              items: items.map((item) => ({
                name: item.name.slice(0, 127),
                quantity: String(item.quantity),
                unitAmount: { currencyCode: 'USD', value: toUnits(item.unitPrice).toFixed(2) },
              })),
            },
          ],
        },
        paypalRequestId: idempotencyKey,
      },
    );

    const paypalOrderId = response.result.id;
    if (!paypalOrderId) throw new Error('missing_paypal_order_id');

    await admin.from('payments').update({ provider_payment_id: paypalOrderId }).eq('order_id', orderId);

    return NextResponse.json({ id: paypalOrderId, orderNumber });
  } catch {
    await admin.from('orders').update({ order_status: 'cancelled' }).eq('id', orderId);
    return NextResponse.json({ error: 'paypal_order_failed' }, { status: 502 });
  }
}
