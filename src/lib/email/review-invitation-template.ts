import 'server-only';

import {
  BODY,
  CHAMPAGNE,
  CONTACT_FOOTER_EN,
  CONTACT_FOOTER_ES,
  INK,
  LINE,
  layout,
} from '@/lib/email/order-receipt-template';
import type { Locale } from '@/lib/i18n';

/**
 * Invitación a reseñar, enviada al marcar el pedido como entregado.
 *
 * Reutiliza la envoltura del recibo (`layout`) para que los dos correos se
 * vean como la misma marca, y porque el HTML de correo es frágil: una sola
 * plantilla probada vale más que dos parecidas.
 *
 * Un enlace por producto. No se pide cuenta ni contraseña: el enlace ya
 * demuestra la compra (ver src/lib/reviews/invitation-token.ts).
 */

export interface InvitationProduct {
  readonly name: string;
  readonly url: string;
}

const t = (locale: Locale, en: string, es: string) => (locale === 'es' ? es : en);

export function buildReviewInvitationEmail(
  products: readonly InvitationProduct[],
  locale: Locale,
): { subject: string; html: string } {
  const subject = t(
    locale,
    'How was your Gaviota by Lia ritual?',
    '¿Qué tal tu ritual de Gaviota by Lia?',
  );

  const intro = t(
    locale,
    'Your order has been delivered. If you have had a chance to try it, your words help other women decide.',
    'Tu pedido ya fue entregado. Si has podido probarlo, tus palabras ayudan a otras mujeres a decidir.',
  );

  const buttons = products
    .map(
      (product) => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid ${LINE};">
        <p style="margin:0 0 10px; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; color:${INK};">
          ${product.name}
        </p>
        <a href="${product.url}" style="display:inline-block; padding:11px 22px; background-color:${CHAMPAGNE}; color:${INK}; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; text-decoration:none; border-radius:2px;">
          ${t(locale, 'Write a review', 'Escribir una reseña')}
        </a>
      </td>
    </tr>`,
    )
    .join('');

  const bodyHtml = `
    <h1 style="margin:0 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:${INK};">
      ${t(locale, 'Tell us how it went', 'Cuéntanos qué tal te fue')}
    </h1>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${BODY};">
      ${intro}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${buttons}
    </table>
    <p style="margin:24px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'No account needed — the link above is yours. We read every review before publishing it.',
        'No necesitas cuenta: el enlace de arriba es tuyo. Leemos cada reseña antes de publicarla.',
      )}
    </p>`;

  const footerHtml = locale === 'es' ? CONTACT_FOOTER_ES : CONTACT_FOOTER_EN;

  return { subject, html: layout({ preheader: subject, bodyHtml, footerHtml }) };
}
