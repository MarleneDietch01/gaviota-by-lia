import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/resend';
import { buildReviewInvitationEmail, type InvitationProduct } from '@/lib/email/review-invitation-template';
import { signReviewToken } from '@/lib/reviews/invitation-token';
import { isLocale, type Locale } from '@/lib/i18n';
import type { Database } from '@/types/database.types';

/**
 * Invitación a reseñar, al marcar un pedido como entregado.
 *
 * -----------------------------------------------------------------------------
 * IDEMPOTENCIA
 * -----------------------------------------------------------------------------
 * A diferencia del recibo, aquí NO hay una columna candado en `orders`: el
 * disparador es una acción manual de administración, no dos webhooks
 * compitiendo. Basta con mirar si ya existe el registro en `email_log`, que
 * es donde de todos modos hay que dejar constancia. Así se evita una columna
 * nueva y, con ella, regenerar los tipos de la base.
 *
 * El reenvío deliberado sigue siendo posible: borrar esa fila de `email_log`,
 * igual que el recibo se reenvía soltando su candado.
 * -----------------------------------------------------------------------------
 *
 * No lanza nunca. Marcar un pedido como entregado es la operación importante;
 * que el correo no salga no puede tumbarla. El fallo queda en `email_log`.
 */

const TEMPLATE = 'review_invitation';

/** El correo de relleno de checkouts anónimos no es una dirección real. */
const PLACEHOLDER_DOMAIN = '@pendiente.gaviotabylia.com';

export type InvitationOutcome =
  | 'sent'
  | 'already_sent'
  | 'no_recipient'
  | 'no_products'
  | 'send_failed';

export async function sendReviewInvitation(
  admin: SupabaseClient<Database>,
  orderId: string,
): Promise<InvitationOutcome> {
  const { data: alreadyLogged } = await admin
    .from('email_log')
    .select('id')
    .eq('order_id', orderId)
    .eq('template', TEMPLATE)
    .eq('status', 'sent')
    .maybeSingle();

  if (alreadyLogged) return 'already_sent';

  const { data: order } = await admin
    .from('orders')
    .select('customer_email, locale')
    .eq('id', orderId)
    .maybeSingle();

  if (!order?.customer_email || order.customer_email.endsWith(PLACEHOLDER_DOMAIN)) {
    return 'no_recipient';
  }

  const locale: Locale = isLocale(order.locale) ? order.locale : 'es';

  const { data: itemRows } = await admin
    .from('order_items')
    .select('product_id, product_name')
    .eq('order_id', orderId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Un pedido puede repetir el mismo producto en varias líneas (tamaños, por
  // ejemplo). Un solo enlace por producto: la reseña es del producto, no de
  // la línea, y el índice de la base solo admite una por pedido y producto.
  const seen = new Set<string>();
  const products: InvitationProduct[] = [];

  for (const row of itemRows ?? []) {
    if (!row.product_id || seen.has(row.product_id)) continue;
    seen.add(row.product_id);
    const token = signReviewToken({ orderId, productId: row.product_id });
    products.push({
      name: row.product_name,
      url: `${siteUrl}/${locale}/review/${token}`,
    });
  }

  if (products.length === 0) return 'no_products';

  const { subject, html } = buildReviewInvitationEmail(products, locale);
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

  return result.ok ? 'sent' : 'send_failed';
}
