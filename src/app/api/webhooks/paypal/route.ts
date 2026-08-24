import 'server-only';

import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayPalAccessToken, getPayPalApiBase } from '@/lib/paypal/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Webhook de PayPal.
 *
 * Mismas reglas que el de Stripe (ver `/api/webhooks/stripe`): firma
 * verificada con el cuerpo crudo, evento registrado ANTES de procesarse en
 * `payment_events` (misma tabla, `provider = 'paypal'`), y ningún monto se
 * recalcula a partir de lo que devuelve el webhook.
 *
 * PayPal no firma con HMAC como Stripe: la verificación es una llamada a su
 * propia API (`/v1/notifications/verify-webhook-signature`) con los headers
 * `Paypal-Transmission-*` más el `webhook_id` configurado en el dashboard.
 * Ese `webhook_id` NO es secreto (identifica el endpoint, no autentica nada),
 * pero sin verificar la firma cualquiera podría llamar a esta URL con un
 * `PAYMENT.CAPTURE.COMPLETED` falso y marcar pedidos como pagados gratis.
 */
export async function POST(request: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });
  }

  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const certUrl = request.headers.get('paypal-cert-url');
  const authAlgo = request.headers.get('paypal-auth-algo');
  const transmissionSig = request.headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'missing_signature_headers' }, { status: 400 });
  }

  const rawBody = await request.text();

  let webhookEvent: { id: string; event_type: string; resource?: Record<string, unknown> };
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const verifyRes = await fetch(`${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    const verifyData = (await verifyRes.json()) as { verification_status?: string };
    if (!verifyRes.ok || verifyData.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'signature_verification_failed' }, { status: 502 });
  }

  const admin = createAdminSupabaseClient();

  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  const { error: insertError } = await admin.from('payment_events').insert({
    provider: 'paypal',
    provider_event_id: webhookEvent.id,
    event_type: webhookEvent.event_type,
    payload_hash: payloadHash,
    processing_status: 'pending',
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'event_log_failed' }, { status: 500 });
  }

  try {
    const resource = webhookEvent.resource ?? {};

    switch (webhookEvent.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // El comprador aprobó, todavía no se capturó el dinero. No cambia el
        // estado del pedido — `PAYMENT.CAPTURE.COMPLETED` es quien lo hace —
        // pero el evento queda registrado para auditoría.
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const customId = resource['custom_id'] as string | undefined;

        if (typeof customId === 'string') {
          await admin
            .from('orders')
            .update({ order_status: 'paid', payment_status: 'paid' })
            .eq('id', customId);

          await admin
            .from('payments')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              provider_payment_id: (resource['id'] as string | undefined) ?? webhookEvent.id,
            })
            .eq('order_id', customId);
        }

        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const customId = resource['custom_id'] as string | undefined;
        if (typeof customId !== 'string') break;

        const amount = resource['amount'] as { currency_code?: string; value?: string } | undefined;

        // Mismo motivo que en Stripe: `orders`/`payments` guardan todo en
        // centavos de USD. Se creó la orden pidiendo 'USD' explícito
        // (create-order/route.ts), así que esto siempre debería serlo — pero
        // se verifica antes de tocar ningún estado, no se asume.
        if (amount?.currency_code !== 'USD') {
          throw new Error(
            `PAYMENT.CAPTURE.REFUNDED con currency_code="${amount?.currency_code}" (se esperaba "USD") — ` +
              `order_id=${customId}. No se actualizó el estado. Revisar manualmente en el dashboard de PayPal.`,
          );
        }

        const { data: payment } = await admin
          .from('payments')
          .select('amount')
          .eq('order_id', customId)
          .eq('provider', 'paypal')
          .maybeSingle();

        const refundedCents = amount.value ? Math.round(Number(amount.value) * 100) : 0;
        const isFullRefund = payment ? refundedCents >= payment.amount : true;
        const status = isFullRefund ? 'refunded' : 'partially_refunded';

        await admin.from('orders').update({ order_status: status, payment_status: status }).eq('id', customId);
        await admin.from('payments').update({ status }).eq('order_id', customId).eq('provider', 'paypal');

        break;
      }

      case 'CUSTOMER.DISPUTE.CREATED': {
        // El recurso de disputa referencia la transacción original por
        // `seller_transaction_id` (el id de la captura, el mismo que se
        // guardó como `provider_payment_id` en PAYMENT.CAPTURE.COMPLETED) —
        // no trae `custom_id` directamente.
        const disputedTransactions = resource['disputed_transactions'] as
          | Array<{ seller_transaction_id?: string }>
          | undefined;
        const captureId = disputedTransactions?.[0]?.seller_transaction_id;
        if (!captureId) break;

        // Igual que en Stripe: no se toca `orders.order_status` ni
        // `orders.payment_status`, solo `payments.status` — es estado del
        // pago, no del pedido. El plazo real lo maneja el Resolution Center
        // de PayPal (correo + panel); este registro es el respaldo interno.
        await admin
          .from('payments')
          .update({ status: 'disputed' })
          .eq('provider', 'paypal')
          .eq('provider_payment_id', captureId);

        break;
      }

      case 'CUSTOMER.DISPUTE.RESOLVED': {
        const disputedTransactions = resource['disputed_transactions'] as
          | Array<{ seller_transaction_id?: string }>
          | undefined;
        const captureId = disputedTransactions?.[0]?.seller_transaction_id;
        if (!captureId) break;

        const outcome = resource['dispute_outcome'] as { outcome_code?: string } | undefined;

        // A favor de la vendedora: el pago vuelve a 'paid'. Cualquier otro
        // desenlace implica que ya hubo o habrá un reembolso, que llega como
        // su propio PAYMENT.CAPTURE.REFUNDED y lo marca ese handler.
        if (outcome?.outcome_code === 'RESOLVED_SELLER_FAVOUR') {
          await admin
            .from('payments')
            .update({ status: 'paid' })
            .eq('provider', 'paypal')
            .eq('provider_payment_id', captureId);
        }

        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const customId = resource['custom_id'] as string | undefined;

        if (typeof customId === 'string') {
          await admin
            .from('orders')
            .update({ order_status: 'cancelled', payment_status: 'failed' })
            .eq('id', customId);

          await admin.from('payments').update({ status: 'failed' }).eq('order_id', customId);
        }

        break;
      }

      default:
        break;
    }

    await admin
      .from('payment_events')
      .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
      .eq('provider', 'paypal')
      .eq('provider_event_id', webhookEvent.id);
  } catch (error) {
    await admin
      .from('payment_events')
      .update({
        processing_status: 'failed',
        error: error instanceof Error ? error.message : 'unknown_error',
      })
      .eq('provider', 'paypal')
      .eq('provider_event_id', webhookEvent.id);

    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
