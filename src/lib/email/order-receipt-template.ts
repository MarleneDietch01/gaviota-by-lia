import 'server-only';

import { formatMoney, type Cents } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';

const WINE = '#6e2239';
const IVORY = '#f6ece8';
const WHITE_WARM = '#fffaf8';
const INK = '#302126';
const BODY = '#5e434d';
const LINE = '#ede0dc';
const CHAMPAGNE = '#c6a87c';

export interface ReceiptItem {
  readonly name: string;
  readonly variantName: string | null;
  readonly quantity: number;
  readonly unitPrice: Cents;
  readonly lineTotal: Cents;
}

export interface ReceiptAddress {
  readonly recipientName: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly country: string;
}

export interface ReceiptOrder {
  readonly orderNumber: string;
  readonly customerEmail: string;
  readonly customerPhone: string | null;
  readonly createdAt: string;
  readonly subtotal: Cents;
  readonly discountTotal: Cents;
  readonly taxTotal: Cents;
  readonly shippingTotal: Cents;
  readonly grandTotal: Cents;
}

const money = (value: Cents, locale: Locale) => formatMoney(value, 'USD', locale === 'es' ? 'es-DO' : 'en-US');

const t = (locale: Locale, en: string, es: string) => (locale === 'es' ? es : en);

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-DO' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

/**
 * Envoltorio HTML compartido por los dos correos. Todo en tablas y estilos
 * inline a propósito: es lo único que Outlook y Gmail renderizan de forma
 * fiable — un <style> en <head> se pierde en demasiados clientes de correo.
 */
function layout(opts: { preheader: string; bodyHtml: string; footerHtml: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gaviota by Lia</title>
</head>
<body style="margin:0; padding:0; background-color:${IVORY}; font-family:Georgia, 'Times New Roman', serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${IVORY};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:${WHITE_WARM}; border-radius:4px; overflow:hidden;">
          <tr>
            <td style="background-color:${WINE}; padding:28px 32px; text-align:center;">
              <span style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-style:italic; color:${WHITE_WARM}; letter-spacing:0.02em;">Gaviota by Lia</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; border-top:1px solid ${LINE}; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${BODY};">
              ${opts.footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: readonly ReceiptItem[], locale: Locale): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid ${LINE}; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:${INK};">
          ${item.name}${item.variantName ? ` — ${item.variantName}` : ''}
          <div style="color:${BODY}; font-size:12px; margin-top:2px;">${t(locale, 'Qty', 'Cant.')} ${item.quantity}</div>
        </td>
        <td align="right" style="padding:10px 0; border-bottom:1px solid ${LINE}; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:${INK}; white-space:nowrap;">
          ${money(item.lineTotal, locale)}
        </td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function totalsTable(order: ReceiptOrder, locale: Locale): string {
  const row = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:4px 0; font-family:Arial, Helvetica, sans-serif; font-size:${bold ? '15px' : '13px'}; color:${bold ? INK : BODY}; font-weight:${bold ? '700' : '400'};">${label}</td>
      <td align="right" style="padding:4px 0; font-family:Arial, Helvetica, sans-serif; font-size:${bold ? '15px' : '13px'}; color:${bold ? INK : BODY}; font-weight:${bold ? '700' : '400'};">${value}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    ${row(t(locale, 'Subtotal', 'Subtotal'), money(order.subtotal, locale))}
    ${order.discountTotal > 0 ? row(t(locale, 'Discount', 'Descuento'), `-${money(order.discountTotal, locale)}`) : ''}
    ${row(t(locale, 'Shipping', 'Envío'), money(order.shippingTotal, locale))}
    ${order.taxTotal > 0 ? row(t(locale, 'Tax', 'Impuesto'), money(order.taxTotal, locale)) : ''}
    <tr><td colspan="2" style="padding-top:8px; border-top:1px solid ${LINE};"></td></tr>
    ${row(t(locale, 'Total', 'Total'), money(order.grandTotal, locale), true)}
  </table>`;
}

function addressBlock(address: ReceiptAddress, locale: Locale): string {
  return `
    <p style="margin:0 0 4px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:${INK};">
      ${t(locale, 'Shipping to', 'Envío a')}
    </p>
    <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${address.recipientName}<br />
      ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
      ${address.city}${address.state ? `, ${address.state}` : ''} ${address.postalCode ?? ''}<br />
      ${address.country}
    </p>`;
}

const CONTACT_FOOTER_EN = `
  Gaviota By Lia LLC — 5 Rangeley Avenue, Providence, RI 02908, United States.<br />
  Questions? Phone / WhatsApp: 401-305-8713 · Email: gaviotabylia@gmail.com`;
const CONTACT_FOOTER_ES = `
  Gaviota By Lia LLC — 5 Rangeley Avenue, Providence, RI 02908, Estados Unidos.<br />
  ¿Dudas? Teléfono / WhatsApp: 401-305-8713 · Correo: gaviotabylia@gmail.com`;

/** Recibo de compra para la clienta. Bilingüe según `orders.locale`. */
export function buildCustomerReceiptEmail(
  order: ReceiptOrder,
  items: readonly ReceiptItem[],
  shippingAddress: ReceiptAddress | null,
  locale: Locale,
): { subject: string; html: string } {
  const subject = t(locale, `Your Gaviota by Lia order #${order.orderNumber}`, `Tu pedido de Gaviota by Lia #${order.orderNumber}`);

  const bodyHtml = `
    <h1 style="margin:0 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:${INK};">
      ${t(locale, 'Thank you for your order', 'Gracias por tu compra')}
    </h1>
    <p style="margin:0 0 24px; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:${BODY};">
      ${t(
        locale,
        'We’re getting your ritual ready. Here’s your receipt.',
        'Estamos preparando tu ritual. Aquí tienes tu recibo.',
      )}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:${BODY};">
      <tr>
        <td>${t(locale, 'Order number', 'Número de pedido')}</td>
        <td align="right" style="color:${INK}; font-weight:700;">#${order.orderNumber}</td>
      </tr>
      <tr>
        <td>${t(locale, 'Order date', 'Fecha del pedido')}</td>
        <td align="right">${formatDate(order.createdAt, locale)}</td>
      </tr>
    </table>
    ${itemsTable(items, locale)}
    ${totalsTable(order, locale)}
    ${shippingAddress ? `<div style="margin-top:24px; padding-top:20px; border-top:1px solid ${LINE};">${addressBlock(shippingAddress, locale)}</div>` : ''}
    <p style="margin:24px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:${BODY};">
      ${t(
        locale,
        'We will email you again once your order ships.',
        'Te escribiremos de nuevo en cuanto tu pedido salga hacia ti.',
      )}
    </p>`;

  const footerHtml = locale === 'es' ? CONTACT_FOOTER_ES : CONTACT_FOOTER_EN;

  return { subject, html: layout({ preheader: subject, bodyHtml, footerHtml }) };
}

/**
 * Notificación de venta para la propietaria. Siempre en español — es la
 * única persona que la recibe y el panel /admin ya es solo-español.
 */
export function buildOwnerNotificationEmail(
  order: ReceiptOrder,
  items: readonly ReceiptItem[],
  shippingAddress: ReceiptAddress | null,
  orderId: string,
): { subject: string; html: string } {
  const locale: Locale = 'es';
  const subject = `Nueva venta — pedido #${order.orderNumber} (${money(order.grandTotal, locale)})`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const bodyHtml = `
    <h1 style="margin:0 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:${INK};">
      Nueva venta
    </h1>
    <p style="margin:0 0 20px; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:${BODY};">
      Pedido #${order.orderNumber} — ${formatDate(order.createdAt, locale)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:${BODY};">
      <tr><td>Cliente</td><td align="right" style="color:${INK};">${order.customerEmail}</td></tr>
      ${order.customerPhone ? `<tr><td>Teléfono</td><td align="right" style="color:${INK};">${order.customerPhone}</td></tr>` : ''}
    </table>
    ${itemsTable(items, locale)}
    ${totalsTable(order, locale)}
    ${shippingAddress ? `<div style="margin-top:24px; padding-top:20px; border-top:1px solid ${LINE};">${addressBlock(shippingAddress, locale)}</div>` : ''}
    ${
      siteUrl
        ? `<p style="margin:24px 0 0;"><a href="${siteUrl}/admin/orders/${orderId}" style="display:inline-block; padding:10px 20px; background-color:${WINE}; color:${WHITE_WARM}; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; text-decoration:none; border-radius:2px;">Ver pedido en el panel</a></p>`
        : ''
    }`;

  const footerHtml = `Notificación automática de gaviotabylia.com. El panel de administración tiene el detalle completo del pedido.
    <br /><span style="color:${CHAMPAGNE};">·</span> Gaviota By Lia LLC`;

  return { subject, html: layout({ preheader: subject, bodyHtml, footerHtml }) };
}
