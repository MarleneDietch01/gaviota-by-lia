import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmails } from '@/lib/email/order-confirmation';

async function finalizeCheckoutSession(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  session: Stripe.Checkout.Session,
) {
  const orderId = session.metadata?.['order_id'];
  if (!orderId || session.payment_status === 'unpaid') throw new Error('checkout_not_ready');

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
  const amountDiscount = session.total_details?.amount_discount ?? 0;
  const amountTotal = session.amount_total ?? undefined;

  const { error: orderUpdateError } = await admin
    .from('orders')
    .update({
      order_status: 'paid',
      payment_status: 'paid',
      ...(session.customer_details?.email ? { customer_email: session.customer_details.email } : {}),
      ...(session.customer_details?.phone ? { customer_phone: session.customer_details.phone } : {}),
      ...(amountTotal !== undefined ? { discount_total: amountDiscount, tax_total: amountTax, grand_total: amountTotal } : {}),
    })
    .eq('id', orderId);
  // Do not issue a receipt from stale totals if the DB rejects the update.
  if (orderUpdateError) throw orderUpdateError;

  const { error: paymentUpdateError } = await admin
    .from('payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      provider_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
      ...(amountTotal !== undefined ? { amount: amountTotal } : {}),
    })
    .eq('order_id', orderId);
  if (paymentUpdateError) throw paymentUpdateError;

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
}

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
 * 3. El servidor fija precios y cupón al crear Checkout. Al confirmar el pago,
 *    se guarda el descuento redondeado, impuesto y total de la sesión firmada
 *    de Stripe, siempre en USD. Si PaymentIntent llega primero, se recupera
 *    esa misma sesión antes de guardar importes y enviar el recibo.
 *
 * -----------------------------------------------------------------------------
 * EVENTOS QUE EL ENDPOINT DEBE TENER SUSCRITOS EN EL DASHBOARD
 * -----------------------------------------------------------------------------
 * Esta lista es la contraparte del `switch` de abajo y hay que mantenerlas
 * iguales. Un evento manejado aquí pero NO suscrito en el dashboard no da
 * ningún error: simplemente no llega nunca, y el código que lo espera parece
 * correcto para siempre mientras el efecto no ocurre.
 *
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.expired          <- ver abajo
 *   payment_intent.succeeded
 *   payment_intent.payment_failed
 *   charge.refunded
 *   charge.dispute.created
 *   charge.dispute.closed
 *
 * `checkout.session.expired` es el que más caro sale olvidar. Es el ÚNICO
 * evento que termina una sesión abandonada: cancela el pedido y devuelve el
 * inventario reservado a la media hora. Sin él, lo único que queda es el cron
 * diario de `/api/cron/release-reservations`, que en el plan Hobby de Vercel
 * puede retrasarse hasta 59 minutos sobre su hora — un carrito abandonado
 * retendría stock hasta un día entero en vez de treinta minutos. La tienda
 * funciona igual, las ventas entran igual, y el inventario se va quedando
 * retenido sin que nada lo señale.
 *
 * Desde que un rechazo de tarjeta dejó de ser terminal (ver
 * `payment_intent.payment_failed`), este evento es además el único que limpia
 * una sesión abandonada tras una tarjeta declinada.
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
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.metadata?.['order_id'] || session.payment_status === 'unpaid') break;
        await finalizeCheckoutSession(admin, session);
        break;
      }

      case 'payment_intent.succeeded': {
        // Con Checkout, `checkout.session.completed` ya marca el pedido como
        // pagado — este caso es la confirmación redundante que Stripe
        // recomienda manejar igualmente (llega primero en algunos métodos de
        // pago). Aplicar el mismo cambio dos veces es seguro: es un SET, no un
        // incremento.
        const intent = event.data.object as Stripe.PaymentIntent;
        // PaymentIntent can arrive first or confirm a delayed payment. Fetch
        // the session so both event paths use its final discount, tax and
        // address before the idempotent inventory/receipt operations.
        if (intent.metadata?.['checkout_managed'] === 'true') {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
          const session = sessions.data[0];
          if (!session || session.metadata?.['order_id'] !== intent.metadata['order_id']) {
            throw new Error('checkout_session_not_found');
          }
          await finalizeCheckoutSession(admin, session);
          break;
        }
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

        // CON CHECKOUT, UNA TARJETA RECHAZADA NO TERMINA NADA.
        //
        // La Checkout Session sigue viva y quien compra puede reintentar con
        // otra tarjeta en la misma página; Stripe reutiliza el PaymentIntent y
        // manda un `payment_failed` por cada intento. Cancelar y soltar la
        // reserva en el primer rechazo rompía justo el reintento que sí acaba
        // en venta: al pagar por fin, `commit_inventory_sale()` volvía a restar
        // `reserved_quantity` —su candado de idempotencia es el asiento de
        // venta, que en ese momento todavía no existía— y esa segunda resta se
        // comía la reserva de OTRO pedido pendiente con la misma variante.
        // Riesgo de sobreventa a partir de algo tan corriente como una tarjeta
        // declinada seguida de otra que sí pasa.
        //
        // El evento terminal de una sesión de Checkout es
        // `checkout.session.expired`, que llega media hora después y cancela y
        // suelta con su propio cerrojo condicionado a `pending_payment`. Aquí
        // el rechazo queda registrado en `payment_events` (insertado más
        // arriba, antes del switch) y no se toca el estado del pedido: el
        // inventario reservado sigue siendo suyo mientras la sesión viva.
        //
        // `checkout_managed` lo pone /api/checkout en `payment_intent_data`
        // exactamente para poder distinguir estos dos mundos aquí.
        if (intent.metadata?.['checkout_managed'] === 'true') break;

        // PaymentIntent directo, sin Checkout de por medio (Payment Element,
        // Fase 4): ahí no hay sesión que caduque ni evento posterior que
        // limpie, así que el fallo SÍ es terminal y hay que soltar aquí.
        //
        // Condicionado a `pending_payment` por lo mismo que el resto:
        // `release_reservation()` resta y no es idempotente.
        const { data: cancelled, error: cancelError } = await admin
          .from('orders')
          .update({ order_status: 'cancelled', payment_status: 'failed' })
          .eq('id', orderId)
          .eq('order_status', 'pending_payment')
          .select('id');

        if (cancelError) throw cancelError;
        if (!cancelled?.length) break;

        await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId);

        await admin.rpc('release_reservation', { p_order_id: orderId });

        break;
      }

      case 'checkout.session.expired': {
        // Carrito abandonado: la compradora llegó a Stripe y no terminó. La
        // sesión se crea con `expires_at` a 31 minutos (ver /api/checkout),
        // así que este evento llega media hora después de abandonarla.
        //
        // Es el mecanismo que impide que `pending_payment` se acumule y, sobre
        // todo, que el stock reservado en `createPendingOrder()` se quede
        // retenido para siempre. El cron diario de
        // /api/cron/release-reservations es solo la red por si este evento no
        // llega.
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.['order_id'];
        if (!orderId) break;

        // El UPDATE condicionado a `pending_payment` hace de cerrojo, y no es
        // una precaución teórica: soltar dos veces NO es inocuo —
        // `release_reservation` resta `reserved_quantity` por variante, así que
        // la segunda pasada se comería la reserva de OTRO pedido que tenga la
        // misma variante pendiente. Si la fila ya no está en `pending_payment`
        // —porque se pagó entre medias, o porque el cron la caducó primero—
        // alguien se ocupó antes y aquí no hay nada que hacer.
        const { data: cancelled, error: cancelError } = await admin
          .from('orders')
          .update({ order_status: 'cancelled', payment_status: 'cancelled' })
          .eq('id', orderId)
          .eq('order_status', 'pending_payment')
          .select('id');

        if (cancelError) throw cancelError;
        // Cero filas = ya se pagó (carrera con `checkout.session.completed`) o
        // ya estaba cancelado. En ninguno de los dos casos se toca el stock.
        if (!cancelled?.length) break;

        await admin
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('order_id', orderId)
          .eq('status', 'pending');

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
