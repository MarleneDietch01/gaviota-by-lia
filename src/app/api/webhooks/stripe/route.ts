import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmails } from '@/lib/email/order-confirmation';

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
      const { data: logged } = await admin.from('payment_events')
        .select('processing_status').eq('provider', 'stripe').eq('provider_event_id', event.id).single();
      if (logged?.processing_status === 'processed') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Un intento anterior falló. Stripe reintenta precisamente para que el
      // efecto se vuelva a ejecutar; conservar la fila no debe convertir el
      // fallo en un falso 200. Las operaciones de abajo son idempotentes.
    }
    else return NextResponse.json({ error: 'event_log_failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.['order_id'];
        if (!orderId) break;
        if (session.payment_status === 'unpaid') break;

        // `orders`/`payments` guardan todo en centavos de USD. Con Adaptive
        // Pricing desactivado (ver /api/checkout) esto siempre debería ser
        // 'usd', pero se verifica de todos modos: si alguna vez no lo es,
        // `session.amount_total` vendría en la moneda de presentación, no en
        // centavos de USD, y grabarlo tal cual corrompería el pedido. Se
        // prefiere un pago sin procesar (evento marcado 'failed', para
        // revisión manual) a una orden con el monto equivocado.
        if (session.currency !== 'usd') {
          throw new Error(
            `checkout.session.completed con currency="${session.currency}" (se esperaba "usd") — ` +
              `order_id=${orderId}. No se escribió ningún monto. Revisar manualmente en el dashboard de Stripe.`,
          );
        }

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
            ...(session.customer_details?.email ? { customer_email: session.customer_details.email } : {}),
            ...(session.customer_details?.phone ? { customer_phone: session.customer_details.phone } : {}),
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

        const shipping = session.collected_information?.shipping_details;
        if (shipping?.address && shipping.name) {
          await admin.from('order_addresses').upsert({
            order_id: orderId, address_type: 'shipping', recipient_name: shipping.name,
            phone: session.customer_details?.phone ?? null,
            address_line_1: shipping.address.line1 ?? '', address_line_2: shipping.address.line2 ?? null,
            city: shipping.address.city ?? '', state: shipping.address.state ?? null,
            postal_code: shipping.address.postal_code ?? null,
            country: (shipping.address.country ?? 'US').slice(0, 2),
          }, { onConflict: 'order_id,address_type' });
        }

        await admin.rpc('commit_inventory_sale', { p_order_id: orderId });

        await sendOrderConfirmationEmails(admin, orderId);

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

        await admin.rpc('commit_inventory_sale', { p_order_id: orderId });

        await sendOrderConfirmationEmails(admin, orderId);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (!paymentIntentId) break;

        // Se busca por `provider_payment_id` en vez de metadata: un reembolso
        // no siempre trae los metadatos originales del pedido, pero el pago
        // ya quedó enlazado a `payments` desde `checkout.session.completed`.
        const { data: payment } = await admin
          .from('payments')
          .select('order_id, amount, currency')
          .eq('provider', 'stripe')
          .eq('provider_payment_id', paymentIntentId)
          .maybeSingle();

        if (!payment) break;

        // Mismo motivo que en checkout.session.completed: si esto no está en
        // USD, no se toca ningún monto — solo se registra el evento (ya
        // insertado arriba) para revisión manual.
        if (charge.currency !== 'usd') {
          throw new Error(
            `charge.refunded con currency="${charge.currency}" (se esperaba "usd") — ` +
              `order_id=${payment.order_id}. No se actualizó el estado. Revisar manualmente en el dashboard de Stripe.`,
          );
        }

        const isFullRefund = charge.amount_refunded >= charge.amount;
        const status = isFullRefund ? 'refunded' : 'partially_refunded';

        await admin.from('orders').update({ order_status: status, payment_status: status }).eq('id', payment.order_id);
        await admin.from('payments').update({ status }).eq('order_id', payment.order_id).eq('provider', 'stripe');

        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;
        if (!paymentIntentId) break;

        // Deliberadamente NO se toca `orders.order_status` ni
        // `orders.payment_status`: una orden puede estar `shipped` y su pago
        // en disputa a la vez, y un solo campo obligaría a perder una de las
        // dos verdades. La disputa es estado del PAGO — vive solo en
        // `payments.status`. `/admin` la muestra sin pisar el estado del pedido.
        //
        // El plazo real para responder lo marca y lo comunica Stripe (correo +
        // Dashboard) — eso no se duplica aquí. Este registro es la señal
        // interna de respaldo para cuando ese correo se pierda.
        await admin
          .from('payments')
          .update({ status: 'disputed' })
          .eq('provider', 'stripe')
          .eq('provider_payment_id', paymentIntentId);

        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;
        if (!paymentIntentId) break;

        // 'won': el cargo se mantiene, el pago vuelve a 'paid'. Cualquier otro
        // desenlace ('lost', etc.) implica que Stripe ya revirtió el cargo —
        // eso llega como su propio `charge.refunded` y lo marca ese handler,
        // así que aquí no se hace nada más que dejarlo como estaba.
        if (dispute.status === 'won') {
          await admin
            .from('payments')
            .update({ status: 'paid' })
            .eq('provider', 'stripe')
            .eq('provider_payment_id', paymentIntentId);
        }

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
