import 'server-only';

import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getProductBySlug } from '@/lib/catalog/products';
import { isLocale, type Locale } from '@/lib/i18n';
import { cents } from '@/lib/commerce/money';

interface CheckoutLine {
  readonly slug: string;
  readonly quantity: number;
}

const MAX_LINE_QUANTITY = 20;
const MAX_LINES = 30;

/**
 * Crea una Checkout Session de Stripe.
 *
 * -----------------------------------------------------------------------------
 * VALIDACIÓN EN SERVIDOR — nada del cliente decide el precio
 * -----------------------------------------------------------------------------
 * El navegador solo envía `slug` + `quantity`. El precio, el nombre y la
 * disponibilidad se leen SIEMPRE de `getProductBySlug()` (la misma fuente de
 * verdad que renderiza el resto del sitio), nunca del cuerpo de la petición.
 * Un cliente que edite el payload para pedir "$0.01" no consigue nada: ese
 * campo se ignora por completo.
 *
 * El pedido se crea con `service_role` porque el comprador puede ser anónimo
 * (sin sesión) y las políticas RLS de `orders` no tienen INSERT para nadie
 * salvo la propia base de datos — es la única vía autorizada.
 * -----------------------------------------------------------------------------
 */
export async function POST(request: NextRequest) {
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

  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) {
    return NextResponse.json({ error: 'invalid_lines' }, { status: 400 });
  }

  const email = typeof customerEmail === 'string' ? customerEmail.trim().slice(0, 254) : '';

  // Límite por IP: crear sesiones de Stripe sin límite es una forma barata de
  // agotar la cuota de la cuenta o de martillar la base de datos con pedidos
  // `pending_payment` que nunca se pagan.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await checkRateLimit(`checkout:${ip}`, 10, 300);
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsedLines: CheckoutLine[] = [];
  for (const raw of lines as unknown[]) {
    if (typeof raw !== 'object' || raw === null) continue;
    const { slug, quantity } = raw as { slug?: unknown; quantity?: unknown };
    if (typeof slug !== 'string' || typeof quantity !== 'number') continue;
    const safeQuantity = Math.trunc(quantity);
    if (safeQuantity <= 0 || safeQuantity > MAX_LINE_QUANTITY) continue;
    parsedLines.push({ slug, quantity: safeQuantity });
  }

  if (parsedLines.length === 0) {
    return NextResponse.json({ error: 'no_valid_lines' }, { status: 400 });
  }

  const resolved = await Promise.all(
    parsedLines.map(async (line) => ({ line, product: await getProductBySlug(line.slug, locale) })),
  );

  const missing = resolved.filter((r) => !r.product);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'unknown_product', slugs: missing.map((m) => m.line.slug) },
      { status: 400 },
    );
  }

  const items = resolved.map(({ line, product }) => ({
    slug: line.slug,
    name: product!.name,
    unitPrice: product!.price,
    quantity: line.quantity,
    imageUrl: product!.image,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = cents(subtotal); // sin descuentos/impuestos/envío en el MVP — LEGAL_TODO.md L10

  const admin = createAdminSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_email: email || 'sin-correo@pendiente.gaviotabylia.com',
      currency: 'USD',
      subtotal,
      grand_total: grandTotal,
      payment_status: 'pending',
      order_status: 'pending_payment',
      reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'order_creation_failed' }, { status: 500 });
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    items.map((item) => ({
      order_id: order.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
    })),
  );

  if (itemsError) {
    return NextResponse.json({ error: 'order_items_failed' }, { status: 500 });
  }

  const idempotencyKey = randomUUID();

  await admin.from('payments').insert({
    order_id: order.id,
    provider: 'stripe',
    idempotency_key: idempotencyKey,
    amount: grandTotal,
    currency: 'USD',
    status: 'pending',
  });

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
        client_reference_id: order.id,
        metadata: { order_id: order.id, order_number: order.order_number },
        // Sin esto, el `PaymentIntent` que Stripe crea detrás de la Checkout
        // Session NO hereda los metadatos de la sesión: `payment_intent.succeeded`
        // y `payment_intent.payment_failed` llegarían sin forma de identificar
        // a qué pedido pertenecen.
        payment_intent_data: { metadata: { order_id: order.id, order_number: order.order_number } },
        success_url: `${siteUrl}/${locale}/checkout/success?order=${order.order_number}`,
        cancel_url: `${siteUrl}/${locale}/checkout/cancel`,
      },
      { idempotencyKey },
    );

    await admin
      .from('payments')
      .update({ provider_payment_id: session.id })
      .eq('order_id', order.id);

    return NextResponse.json({ url: session.url });
  } catch {
    await admin.from('orders').update({ order_status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'stripe_session_failed' }, { status: 502 });
  }
}
