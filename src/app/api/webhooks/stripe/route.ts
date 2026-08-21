import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Webhook de Stripe.
 *
 * -----------------------------------------------------------------------------
 * REGLAS QUE NO SE NEGOCIAN
 * -----------------------------------------------------------------------------
 * 1. Firma verificada SIEMPRE, con el cuerpo CRUDO (no el JSON re-serializado:
 *    un solo espacio de diferencia invalida la firma HMAC).
 * 2. El evento se REGISTRA antes de procesarse (insert en `payment_events` con
 *    `unique(provider, provider_event_id)`). Si el insert choca porque el
 *    evento ya existe, se responde 200 sin volver a aplicar el efecto — Stripe
 *    reintenta ante cualquier duda (timeout, 500, lentitud) y sin esto un
 *    reintento duplicaría el pedido pagado.
 * 3. Nunca se confía en `session.amount_total` para decidir si el pedido está
 *    "bien": el monto ya se fijó al crear la sesión desde `orders.grand_total`
 *    en `/api/checkout`, así que aquí solo se lee el `order_id` de los
 *    metadatos y se actualiza SU estado — no se recalcula nada a partir de lo
 *    que devuelve Stripe.
 * -----------------------------------------------------------------------------
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    // Firma inválida: puede ser un secreto de webhook equivocado o una
    // petición que no viene de Stripe. Nunca se procesa sin verificar.
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Registrar PRIMERO. `payload_hash` guarda un hash, no el payload completo:
  // basta para detectar manipulación sin almacenar datos de pago de más.
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  const { error: insertError } = await admin.from('payment_events').insert({
    provider: 'stripe',
    provider_event_id: event.id,
    event_type: event.type,
    payload_hash: payloadHash,
    processing_status: 'pending',
  });

  if (insertError) {
    // Choque de la restricción única (provider, provider_event_id) => este
    // evento ya se procesó en un intento anterior. Éxito silencioso.
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'event_log_failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.['order_id'];
        if (!orderId) break;

        // Si la sesión llevaba Stripe Tax activado, el impuesto real solo se
        // conoce AQUÍ — se calculó en la página alojada de Stripe según la
        // dirección que introdujo la compradora, después de crear el pedido.
        // `grand_total` se corrige para que siga cuadrando con la restricción
        // `totals_add_up` (subtotal - descuento + impuesto + envío).
        const amountTax = session.total_details?.amount_tax ?? 0;
        const amountTotal = session.amount_total ?? undefined;

        await admin
          .from('orders')
          .update({
            order_status: 'paid',
            payment_status: 'paid',
            ...(amountTotal !== undefined ? { tax_total: amountTax, grand_total: amountTotal } : {}),
          })
          .eq('id', orderId);

        await admin
          .from('payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            provider_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
            ...(amountTotal !== undefined ? { amount: amountTotal } : {}),
          })
          .eq('order_id', orderId);

        break;
      }

      case 'payment_intent.succeeded': {
        // Con Checkout, `checkout.session.completed` ya marca el pedido como
        // pagado — este caso es la confirmación redundante que Stripe
        // recomienda manejar igualmente (llega primero en algunos métodos de
        // pago). Aplicar el mismo cambio dos veces es seguro: es un SET, no un
        // incremento.
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.['order_id'];
        if (!orderId) break;

        await admin
          .from('orders')
          .update({ order_status: 'paid', payment_status: 'paid' })
          .eq('id', orderId);

        await admin
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString(), provider_payment_id: intent.id })
          .eq('order_id', orderId);

        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.['order_id'];
        if (!orderId) break;

        await admin
          .from('orders')
          .update({ order_status: 'cancelled', payment_status: 'failed' })
          .eq('id', orderId);

        await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId);

        // No-op si no hay variantes reservadas todavía (ver nota en
        // /api/checkout: el inventario real sigue pendiente de CONTENT_TODO.md
        // C6) — queda lista para cuando sí las haya.
        await admin.rpc('release_reservation', { p_order_id: orderId });

        break;
      }

      default:
        // Evento reconocido por Stripe pero no manejado aquí — se registra
        // (ya insertado arriba) y se ignora explícitamente.
        break;
    }

    await admin
      .from('payment_events')
      .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id);
  } catch (error) {
    await admin
      .from('payment_events')
      .update({
        processing_status: 'failed',
        error: error instanceof Error ? error.message : 'unknown_error',
      })
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id);

    // 500 para que Stripe reintente — el evento ya está registrado, así que el
    // reintento no lo duplica, solo reintenta el efecto que falló.
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
