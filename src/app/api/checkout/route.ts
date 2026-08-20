import 'server-only';

import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createPendingOrder, validateCheckoutLines } from '@/lib/commerce/checkout';
import { isSameOriginRequest } from '@/lib/security/origin';
import { parseOptionalCheckoutEmail } from '@/lib/validation/checkout';
import { isLocale, type Locale } from '@/lib/i18n';

/**
 * Crea una Checkout Session de Stripe.
 *
 * -----------------------------------------------------------------------------
 * VALIDACIÓN EN SERVIDOR — nada del cliente decide el precio
 * -----------------------------------------------------------------------------
 * El navegador solo envía `slug` + `quantity`. El precio, el nombre y la
 * disponibilidad se validan SIEMPRE en `validateCheckoutLines()` (que lee de
 * la misma fuente de verdad que renderiza el resto del sitio), nunca del
 * cuerpo de la petición. Un cliente que edite el payload para pedir "$0.01"
 * no consigue nada: ese campo se ignora por completo.
 *
 * El pedido se crea con `service_role` porque el comprador puede ser anónimo
 * (sin sesión) y las políticas RLS de `orders` no tienen INSERT para nadie
 * salvo la propia base de datos — es la única vía autorizada.
 * -----------------------------------------------------------------------------
 */
export async function POST(request: NextRequest) {
  // Route Handler, no Server Action: Next no aplica aquí la comprobación de
  // origen automática que sí hace con `'use server'`. Ver el comentario en
  // `lib/security/origin.ts`.
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  // Se resuelve ANTES de escribir nada en la base: si falta la configuración
  // de Stripe, la petición falla aquí y no deja pedidos huérfanos en
  // `pending_payment` sin ninguna sesión de pago detrás.
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
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

  // Límite por IP: crear sesiones de Stripe sin límite es una forma barata de
  // agotar la cuota de la cuenta o de martillar la base de datos con pedidos
  // `pending_payment` que nunca se pagan.
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const idempotencyKey = randomUUID();

  const pendingOrder = await createPendingOrder(admin, {
    email,
    items,
    subtotal,
    provider: 'stripe',
    idempotencyKey,
  });

  if ('error' in pendingOrder) {
    return NextResponse.json({ error: pendingOrder.error }, { status: 500 });
  }

  const { orderId, orderNumber } = pendingOrder;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: item.unitPrice,
            product_data: {
              name: item.name,
              images: [`${siteUrl}${item.imageUrl}`],
            },
          },
        })),
        ...(email ? { customer_email: email } : {}),
        client_reference_id: orderId,
        metadata: { order_id: orderId, order_number: orderNumber },
        // Sin esto, el `PaymentIntent` que Stripe crea detrás de la Checkout
        // Session NO hereda los metadatos de la sesión: `payment_intent.succeeded`
        // y `payment_intent.payment_failed` llegarían sin forma de identificar
        // a qué pedido pertenecen.
        payment_intent_data: { metadata: { order_id: orderId, order_number: orderNumber } },
        success_url: `${siteUrl}/${locale}/checkout/success?order=${orderNumber}`,
        cancel_url: `${siteUrl}/${locale}/checkout/cancel`,
      },
      { idempotencyKey },
    );

    await admin.from('payments').update({ provider_payment_id: session.id }).eq('order_id', orderId);

    return NextResponse.json({ url: session.url });
  } catch {
    await admin.from('orders').update({ order_status: 'cancelled' }).eq('id', orderId);
    return NextResponse.json({ error: 'stripe_session_failed' }, { status: 502 });
  }
}
