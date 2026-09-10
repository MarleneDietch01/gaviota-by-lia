import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/resend';
import { buildShippingNotificationEmail } from '@/lib/email/shipping-notification-template';
import { isLocale, type Locale } from '@/lib/i18n';
import type { Database } from '@/types/database.types';

/**
 * Aviso de envío a la clienta, al marcar un pedido como enviado.
 *
 * -----------------------------------------------------------------------------
 * IDEMPOTENCIA
 * -----------------------------------------------------------------------------
 * Igual que la invitación a reseñar: el registro en `email_log` es el candado,
 * sin columna nueva en la base. El disparador es una acción manual de
 * administración, no dos webhooks compitiendo.
 *
 * Con una diferencia que importa: `markOrderShipped` también sirve para
 * CORREGIR un número de rastreo mal tecleado. Si el número cambió, la clienta
 * tiene en su bandeja un número que no sirve y hay que volver a avisarla —
 * para eso está `trackingChanged`, que salta el candado a propósito. Repetir
 * el mismo número, en cambio, no se reenvía.
 * -----------------------------------------------------------------------------
 *
 * No lanza nunca. Registrar el envío es la operación importante; que el correo
 * no salga no puede tumbarla. El fallo queda en `email_log`.
 */

const TEMPLATE = 'shipping_notification';

/** El correo de relleno de checkouts anónimos no es una dirección real. */
const PLACEHOLDER_DOMAIN = '@pendiente.gaviotabylia.com';

export type ShippingNotificationOutcome =
  | 'sent'
  | 'already_sent'
  | 'no_recipient'
  | 'no_tracking'
  | 'not_configured'
  | 'send_failed';

export async function sendShippingNotification(
  admin: SupabaseClient<Database>,
  orderId: string,
  options: { trackingChanged: boolean },
): Promise<ShippingNotificationOutcome> {
  if (!options.trackingChanged) {
    const { data: alreadyLogged } = await admin
      .from('email_log')
      .select('id')
      .eq('order_id', orderId)
      .eq('template', TEMPLATE)
      .eq('status', 'sent')
      .maybeSingle();

    if (alreadyLogged) return 'already_sent';
  }

  const [{ data: order }, { data: shipment }] = await Promise.all([
    admin.from('orders').select('order_number, customer_email, locale').eq('id', orderId).maybeSingle(),
    admin
      .from('shipments')
      .select('carrier, tracking_number, tracking_url')
      .eq('order_id', orderId)
      .maybeSingle(),
  ]);

  if (!order?.customer_email || order.customer_email.endsWith(PLACEHOLDER_DOMAIN)) {
    return 'no_recipient';
  }

  // Sin número no hay nada que avisar. Puede pasar si el pedido se entregó en
  // mano y se marcó enviado sin rastreo.
  if (!shipment?.tracking_number || !shipment.carrier) return 'no_tracking';

  const locale: Locale = isLocale(order.locale) ? order.locale : 'es';

  const { subject, html } = buildShippingNotificationEmail(
    {
      orderNumber: order.order_number,
      carrier: shipment.carrier,
      trackingNumber: shipment.tracking_number,
      trackingUrl: shipment.tracking_url,
    },
    locale,
  );

  const result = await sendEmail({
    to: order.customer_email,
    subject,
    html,
    replyTo: 'gaviotabylia@gmail.com',
  });

  await admin.from('email_log').insert({
    order_id: orderId,
    to_email: order.customer_email,
    template: TEMPLATE,
    status: result.ok ? 'sent' : 'failed',
    provider_id: result.ok ? result.id : null,
    error: result.ok ? null : `${result.reason}${result.detail ? `: ${result.detail}` : ''}`,
  });

  if (result.ok) return 'sent';
  // "Falta configurar Resend" y "el envío falló" piden acciones distintas de
  // quien administra: la primera se arregla en Vercel, la segunda se reintenta.
  return result.reason === 'not_configured' ? 'not_configured' : 'send_failed';
}
