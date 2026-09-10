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
 * Aviso de envío con número de rastreo.
 *
 * Reutiliza la envoltura del recibo (`layout`), igual que la invitación a
 * reseñar: el HTML de correo es frágil y una sola plantilla probada vale más
 * que tres parecidas.
 *
 * La política de envíos publicada promete este correo desde antes de que
 * existiera ("recibirás una confirmación por correo electrónico con número de
 * seguimiento en cuanto se envíe tu pedido"). Hasta el 2026-09-10 el número se
 * guardaba en `shipments` y solo lo veía quien administra.
 */

export interface ShipmentDetails {
  readonly orderNumber: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  /** URL que escribió quien administra. Puede venir vacía. */
  readonly trackingUrl: string | null;
}

const t = (locale: Locale, en: string, es: string) => (locale === 'es' ? es : en);

/**
 * Escapa el texto que entra en el HTML.
 *
 * El transportista y el número de rastreo los teclea quien administra, así que
 * no son entrada anónima — pero un `&` en un nombre de transportista basta
 * para romper el marcado, y escapar sale gratis.
 */
const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Enlace de rastreo cuando quien administra no pegó uno.
 *
 * Solo transportistas de EE. UU., que es a donde enviamos (`allowed_countries`
 * en /api/checkout). Si el transportista no está en la lista, el correo enseña
 * el número sin enlace: es preferible a mandar a la clienta a una página que
 * no reconoce su número.
 */
function carrierTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const key = carrier.toLowerCase();
  const n = encodeURIComponent(trackingNumber);

  if (key.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (key.includes('ups')) return `https://www.ups.com/track?tracknum=${n}`;
  if (key.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (key.includes('dhl')) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${n}`;
  return null;
}

/**
 * Un `href` solo se acepta si es http(s).
 *
 * `z.string().url()` da por buenos esquemas como `javascript:`, y aunque en un
 * cliente de correo eso es inerte, no hay razón para escribirlo en el HTML.
 */
function safeHref(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

export function buildShippingNotificationEmail(
  shipment: ShipmentDetails,
  locale: Locale,
): { subject: string; html: string } {
  const subject = t(
    locale,
    `Your order is on its way — #${shipment.orderNumber}`,
    `Tu pedido va en camino — #${shipment.orderNumber}`,
  );

  const href =
    safeHref(shipment.trackingUrl) ?? carrierTrackingUrl(shipment.carrier, shipment.trackingNumber);

  const button = href
    ? `
    <p style="margin:0 0 4px;">
      <a href="${esc(href)}" style="display:inline-block; padding:12px 24px; background-color:${CHAMPAGNE}; color:${INK}; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; text-decoration:none; border-radius:2px;">
        ${t(locale, 'Track my package', 'Seguir mi paquete')}
      </a>
    </p>`
    : '';

  // Solo se promete un plazo cuando el transportista es el de la política de
  // envíos publicada. Con cualquier otro, el plazo sería inventado.
  const eta = shipment.carrier.toLowerCase().includes('usps')
    ? `
    <p style="margin:20px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'USPS Priority Mail usually delivers in 3 to 4 business days.',
        'USPS Priority Mail suele entregar en 3 a 4 días hábiles.',
      )}
    </p>`
    : '';

  const bodyHtml = `
    <h1 style="margin:0 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:${INK};">
      ${t(locale, 'Your order is on its way', 'Tu pedido va en camino')}
    </h1>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        `Order #${esc(shipment.orderNumber)} has left our hands. Here is the number to follow it.`,
        `El pedido #${esc(shipment.orderNumber)} ya salió de nuestras manos. Aquí tienes el número para seguirlo.`,
      )}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE}; border-bottom:1px solid ${LINE};">
      <tr>
        <td style="padding:16px 0;">
          <p style="margin:0 0 4px; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:${BODY};">
            ${t(locale, 'Carrier', 'Transportista')}
          </p>
          <p style="margin:0 0 14px; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; color:${INK};">
            ${esc(shipment.carrier)}
          </p>
          <p style="margin:0 0 4px; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:${BODY};">
            ${t(locale, 'Tracking number', 'Número de rastreo')}
          </p>
          <p style="margin:0 0 16px; font-family:'Courier New', Courier, monospace; font-size:15px; font-weight:700; color:${INK}; word-break:break-all;">
            ${esc(shipment.trackingNumber)}
          </p>
          ${button}
        </td>
      </tr>
    </table>
    ${eta}
    <p style="margin:12px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'Tracking can take a few hours to show movement after the carrier scans the parcel. If it still shows nothing tomorrow, write to us.',
        'El rastreo puede tardar unas horas en mostrar movimiento después de que el transportista registre el paquete. Si mañana sigue sin aparecer nada, escríbenos.',
      )}
    </p>`;

  const footerHtml = locale === 'es' ? CONTACT_FOOTER_ES : CONTACT_FOOTER_EN;

  return { subject, html: layout({ preheader: subject, bodyHtml, footerHtml }) };
}
