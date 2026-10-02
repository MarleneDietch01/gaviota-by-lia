import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/resend';
import {
  BODY,
  CHAMPAGNE,
  CONTACT_FOOTER_EN,
  CONTACT_FOOTER_ES,
  INK,
  layout,
} from '@/lib/email/order-receipt-template';
import { isLocale, type Locale } from '@/lib/i18n';
import type { Database } from '@/types/database.types';

/**
 * Aviso de reposición: un correo por petición abierta en
 * `back_in_stock_requests`, cuando el producto vuelve a tener stock.
 *
 * -----------------------------------------------------------------------------
 * UNA SOLA VEZ
 * -----------------------------------------------------------------------------
 * Cada fila se reclama con un UPDATE condicionado a `notified_at is null`
 * ANTES de enviar. Dos ajustes de stock seguidos desde el panel no mandan dos
 * correos: el segundo no encuentra filas que reclamar. Si el envío falla, la
 * fila se libera para que salga en el siguiente ajuste.
 * -----------------------------------------------------------------------------
 *
 * No lanza nunca: ajustar el inventario es lo importante; el fallo de un
 * correo queda en `email_log`.
 */

const TEMPLATE = 'back_in_stock';
const BATCH = 200;

const t = (locale: Locale, en: string, es: string) => (locale === 'es' ? es : en);

function buildEmail(name: string, url: string, locale: Locale): { subject: string; html: string } {
  const subject = t(locale, `${name} is back`, `Volvió: ${name}`);
  const bodyHtml = `
    <h1 style="margin:0 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:${INK};">
      ${t(locale, `${name} is back in stock`, `${name} ya está disponible`)}
    </h1>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'You asked us to let you know. It is available again in our store, while stock lasts.',
        'Nos pediste que te avisáramos. Ya está otra vez en la tienda, hasta agotar existencias.',
      )}
    </p>
    <a href="${url}" style="display:inline-block; padding:11px 22px; background-color:${CHAMPAGNE}; color:${INK}; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; text-decoration:none; border-radius:2px;">
      ${t(locale, 'View product', 'Ver producto')}
    </a>
    <p style="margin:24px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'This is the only email you will get about this alert. It does not subscribe you to anything.',
        'Es el único correo que recibirás por este aviso. No te suscribe a nada.',
      )}
    </p>`;
  const footerHtml = locale === 'es' ? CONTACT_FOOTER_ES : CONTACT_FOOTER_EN;
  return { subject, html: layout({ preheader: subject, bodyHtml, footerHtml }) };
}

export interface BackInStockOutcome {
  readonly sent: number;
  readonly failed: number;
}

export async function notifyBackInStock(
  admin: SupabaseClient<Database>,
  productId: string,
): Promise<BackInStockOutcome> {
  const outcome = { sent: 0, failed: 0 };

  const { data: product } = await admin
    .from('products')
    .select('slug, name, name_en, status')
    .eq('id', productId)
    .maybeSingle();
  if (!product || product.status !== 'active') return outcome;

  const { data: requests } = await admin
    .from('back_in_stock_requests')
    .select('id')
    .eq('product_id', productId)
    .is('notified_at', null)
    .order('created_at')
    .limit(BATCH);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  for (const { id } of requests ?? []) {
    const { data: claimed } = await admin
      .from('back_in_stock_requests')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', id)
      .is('notified_at', null)
      .select('email, locale')
      .maybeSingle();
    if (!claimed) continue;

    const locale: Locale = isLocale(claimed.locale) ? claimed.locale : 'es';
    const name = locale === 'en' ? (product.name_en ?? product.name) : product.name;
    const { subject, html } = buildEmail(name, `${siteUrl}/${locale}/products/${product.slug}`, locale);

    const result = await sendEmail({ to: claimed.email, subject, html, replyTo: 'gaviotabylia@gmail.com' });

    await admin.from('email_log').insert({
      order_id: null,
      to_email: claimed.email,
      template: TEMPLATE,
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.ok ? result.id : null,
      error: result.ok ? null : `${result.reason}${result.detail ? `: ${result.detail}` : ''}`,
    });

    if (result.ok) {
      outcome.sent += 1;
    } else {
      outcome.failed += 1;
      await admin.from('back_in_stock_requests').update({ notified_at: null }).eq('id', id);
    }
  }

  return outcome;
}
