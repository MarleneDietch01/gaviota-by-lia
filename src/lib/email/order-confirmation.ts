import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { cents } from '@/lib/commerce/money';
import { sendEmail } from '@/lib/email/resend';
import {
  buildCustomerReceiptEmail,
  buildOwnerNotificationEmail,
  type ReceiptAddress,
  type ReceiptItem,
  type ReceiptOrder,
} from '@/lib/email/order-receipt-template';
import { isLocale, type Locale } from '@/lib/i18n';
import type { Database } from '@/types/database.types';

/**
 * Envía el recibo de compra a la clienta y la notificación de venta a la
 * propietaria, una vez que un pedido queda pagado.
 *
 * -----------------------------------------------------------------------------
 * IDEMPOTENCIA
 * -----------------------------------------------------------------------------
 * Se llama desde tres puntos distintos de los webhooks (Stripe
 * `checkout.session.completed` Y `payment_intent.succeeded` — Stripe
 * recomienda manejar ambos y no garantiza cuál llega primero —, y PayPal
 * `PAYMENT.CAPTURE.COMPLETED`). Sin un candado, el mismo pedido podría
 * disparar dos recibos.
 *
 * `orders.confirmation_email_sent_at` es ese candado: se reclama con un
 * UPDATE condicionado a `IS NULL` (atómico en Postgres — dos llamadas
 * concurrentes nunca reclaman las dos) ANTES de enviar nada. Si el envío del
 * recibo a la clienta falla, se revierte a NULL para que el reintento del
 * webhook pueda volver a intentarlo; si solo falla la notificación a la
 * propietaria, se deja reclamado (lo importante — que la clienta reciba su
 * recibo — ya ocurrió) y el fallo queda en `email_log` para revisión manual.
 * -----------------------------------------------------------------------------
 */
export async function sendOrderConfirmationEmails(
  admin: SupabaseClient<Database>,
  orderId: string,
): Promise<void> {
  const { data: claimed } = await admin
    .from('orders')
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('confirmation_email_sent_at', null)
    .select(
      'order_number, customer_email, customer_phone, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, locale, created_at',
    )
    .maybeSingle();

  if (!claimed) return; // ya se envió, o lo está reclamando otra invocación concurrente

  const locale: Locale = isLocale(claimed.locale) ? claimed.locale : 'en';

  const order: ReceiptOrder = {
    orderNumber: claimed.order_number,
    customerEmail: claimed.customer_email,
    customerPhone: claimed.customer_phone,
    createdAt: claimed.created_at,
    subtotal: cents(claimed.subtotal),
    discountTotal: cents(claimed.discount_total),
    taxTotal: cents(claimed.tax_total),
    shippingTotal: cents(claimed.shipping_total),
    grandTotal: cents(claimed.grand_total),
  };

  const [{ data: itemRows }, { data: addressRow }] = await Promise.all([
    admin
      .from('order_items')
      .select('product_name, variant_name, quantity, unit_price, line_total')
      .eq('order_id', orderId),
    admin
      .from('order_addresses')
      .select('recipient_name, address_line_1, address_line_2, city, state, postal_code, country')
      .eq('order_id', orderId)
      .eq('address_type', 'shipping')
      .maybeSingle(),
  ]);

  const items: readonly ReceiptItem[] = (itemRows ?? []).map((row) => ({
    name: row.product_name,
    variantName: row.variant_name,
    quantity: row.quantity,
    unitPrice: cents(row.unit_price),
    lineTotal: cents(row.line_total),
  }));

  const shippingAddress: ReceiptAddress | null = addressRow
    ? {
        recipientName: addressRow.recipient_name,
        addressLine1: addressRow.address_line_1,
        addressLine2: addressRow.address_line_2,
        city: addressRow.city,
        state: addressRow.state,
        postalCode: addressRow.postal_code,
        country: addressRow.country,
      }
    : null;

  // El correo de prueba de checkouts abandonados/anónimos no es un correo
  // real: no tiene sentido intentar enviarle nada, y Resend lo rechazaría.
  const hasRealCustomerEmail = !order.customerEmail.endsWith('@pendiente.gaviotabylia.com');

  let customerSendFailed = false;

  if (hasRealCustomerEmail) {
    const { subject, html } = buildCustomerReceiptEmail(order, items, shippingAddress, locale);
    const result = await sendEmail({ to: order.customerEmail, subject, html, replyTo: 'gaviotabylia@gmail.com' });

    await admin.from('email_log').insert({
      order_id: orderId,
      to_email: order.customerEmail,
      template: 'order_receipt',
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.ok ? result.id : null,
      error: result.ok ? null : `${result.reason}${result.detail ? `: ${result.detail}` : ''}`,
    });

    // "not_configured" (falta RESEND_API_KEY/EMAIL_FROM) no es un fallo
    // transitorio — reintentar el mismo webhook no lo va a arreglar, así que
    // no se marca como fallo de reintento. Un fallo real de envío sí.
    if (!result.ok && result.reason === 'request_failed') {
      customerSendFailed = true;
    }
  }

  const ownerEmail = process.env.ADMIN_EMAIL;
  if (ownerEmail) {
    const { subject, html } = buildOwnerNotificationEmail(order, items, shippingAddress, orderId);
    const result = await sendEmail({ to: ownerEmail, subject, html });

    await admin.from('email_log').insert({
      order_id: orderId,
      to_email: ownerEmail,
      template: 'owner_notification',
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.ok ? result.id : null,
      error: result.ok ? null : `${result.reason}${result.detail ? `: ${result.detail}` : ''}`,
    });
  }

  if (customerSendFailed) {
    // Revertir el candado: el pedido queda pagado (eso no se toca), pero sin
    // recibo confirmado enviado, para que el próximo reintento del webhook lo
    // vuelva a intentar.
    await admin.from('orders').update({ confirmation_email_sent_at: null }).eq('id', orderId);
    throw new Error(`order_confirmation_email_failed: order ${orderId}`);
  }
}
