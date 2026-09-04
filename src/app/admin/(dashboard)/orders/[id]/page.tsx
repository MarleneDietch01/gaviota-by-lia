import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';
import { markOrderShipped, resendOrderConfirmation, saveOrderNotes } from '../actions';

export const metadata = { title: 'Pedido' };

// Ver el mismo comentario en `orders/page.tsx`: correo de relleno de
// checkout cuando no hubo email real, no una clienta.
const PLACEHOLDER_EMAIL = 'sin-correo@pendiente.gaviotabylia.com';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  processing: 'En proceso',
  ready_to_ship: 'Listo para enviar',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  partially_refunded: 'Reembolso parcial',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, customer_email, customer_phone, subtotal, shipping_total, discount_total, tax_total,
       grand_total, order_status, payment_status, internal_notes, customer_notes, created_at,
       confirmation_email_sent_at,
       order_items ( product_name, variant_name, quantity, unit_price, line_total ),
       order_addresses ( address_type, recipient_name, address_line_1, address_line_2, city, state, postal_code, country, phone ),
       payments ( provider, status, amount ),
       shipments ( id, carrier, tracking_number, tracking_url, status, shipped_at, delivered_at ),
       order_status_history ( id, previous_status, new_status, note, created_at, changed_by ),
       email_log ( id, template, to_email, status, error, created_at )`,
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !order) notFound();

  const disputedPayment = order.payments?.find((p) => p.status === 'disputed');
  const disputed = Boolean(disputedPayment);
  const shippingAddress = order.order_addresses?.find((a) => a.address_type === 'shipping');
  const shipment = order.shipments?.[0];
  const canShip = order.payment_status === 'paid' && order.order_status !== 'shipped' && order.order_status !== 'delivered';

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-body hover:text-rose">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-h2">{order.order_number}</h1>
        <span className="inline-flex rounded-pill bg-powder/40 px-2.5 py-1 text-xs font-semibold text-rose-deep">
          {STATUS_LABEL[order.order_status] ?? order.order_status}
        </span>
      </div>
      <p className="mt-1 text-sm text-body">
        {order.customer_email === PLACEHOLDER_EMAIL ? (
          <span className="italic text-muted">Sin datos de cliente</span>
        ) : (
          order.customer_email
        )}
        {order.customer_phone ? ` · ${order.customer_phone}` : ''}
      </p>
      <p className="text-xs text-muted">{formatDate(order.created_at)}</p>

      {disputed ? (
        <div className="mt-6 rounded-sm border border-danger/40 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-danger">
            Este pago está en disputa. Revisa y responde en el dashboard de{' '}
            {disputedPayment?.provider === 'paypal' ? 'PayPal' : 'Stripe'} antes de que venza el plazo.
          </p>
        </div>
      ) : null}

      {errorParam ? (
        <p role="alert" className="mt-4 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger">
          {errorParam}
        </p>
      ) : null}
      {saved && !errorParam ? (
        <p role="status" className="mt-4 rounded-sm border border-success/40 bg-success/10 p-3 text-sm font-medium text-success">
          Cambios guardados.
        </p>
      ) : null}

      {/* -------------------------------------------------------------- */}
      {/* Envío y rastreo                                                 */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="shipping-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="shipping-heading" className="text-h3">Envío</h2>

        {shippingAddress ? (
          <address className="mt-2 text-sm not-italic text-body">
            {shippingAddress.recipient_name}<br />
            {shippingAddress.address_line_1}{shippingAddress.address_line_2 ? `, ${shippingAddress.address_line_2}` : ''}<br />
            {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.postal_code}<br />
            {shippingAddress.country}
          </address>
        ) : (
          <p className="mt-2 text-sm text-muted">Sin dirección de envío registrada.</p>
        )}

        {shipment?.tracking_number ? (
          <div className="mt-4 rounded-xs bg-success/10 p-3 text-sm text-success">
            <p className="font-semibold">Enviado — {shipment.carrier}</p>
            <p className="tabular">Rastreo: {shipment.tracking_number}</p>
            {shipment.tracking_url ? (
              <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="underline">
                Ver seguimiento
              </a>
            ) : null}
            {shipment.shipped_at ? <p className="text-xs text-body">Enviado el {formatDate(shipment.shipped_at)}</p> : null}
          </div>
        ) : null}

        {canShip ? (
          <form action={markOrderShipped} className="mt-4 space-y-3">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="carrier" className="block text-sm font-medium">Transportadora</label>
                <input
                  id="carrier"
                  name="carrier"
                  type="text"
                  required
                  defaultValue={shipment?.carrier ?? 'USPS Priority Mail'}
                  className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium">Número de rastreo</label>
                <input
                  id="trackingNumber"
                  name="trackingNumber"
                  type="text"
                  required
                  defaultValue={shipment?.tracking_number ?? ''}
                  className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm tabular"
                />
              </div>
            </div>
            <div>
              <label htmlFor="trackingUrl" className="block text-sm font-medium">
                Enlace de seguimiento (opcional)
              </label>
              <input
                id="trackingUrl"
                name="trackingUrl"
                type="url"
                placeholder="https://tools.usps.com/go/TrackConfirmAction?tLabels=..."
                defaultValue={shipment?.tracking_url ?? ''}
                className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
            >
              {shipment?.tracking_number ? 'Actualizar envío' : 'Marcar como enviado'}
            </button>
          </form>
        ) : order.payment_status !== 'paid' ? (
          <p className="mt-3 text-sm text-muted">Este pedido todavía no está pagado — no se puede despachar.</p>
        ) : (
          <p className="mt-3 text-sm text-muted">Este pedido ya fue enviado o entregado.</p>
        )}
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Artículos                                                       */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="items-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="items-heading" className="text-h3">Artículos</h2>
        <ul className="mt-3 divide-y divide-line">
          {order.order_items?.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span>
                {item.product_name}
                {item.variant_name ? ` · ${item.variant_name}` : ''} × {item.quantity}
              </span>
              <span className="tabular font-medium">{formatMoney(cents(item.line_total), 'USD', 'es-US')}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-body">Subtotal</dt>
            <dd className="tabular">{formatMoney(cents(order.subtotal), 'USD', 'es-US')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-body">Envío</dt>
            <dd className="tabular">{formatMoney(cents(order.shipping_total), 'USD', 'es-US')}</dd>
          </div>
          {order.discount_total > 0 ? (
            <div className="flex justify-between">
              <dt className="text-body">Descuento</dt>
              <dd className="tabular">-{formatMoney(cents(order.discount_total), 'USD', 'es-US')}</dd>
            </div>
          ) : null}
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd className="tabular">{formatMoney(cents(order.grand_total), 'USD', 'es-US')}</dd>
          </div>
        </dl>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Correo de confirmación                                          */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="email-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="email-heading" className="text-h3">Correo de confirmación</h2>
        <p className="mt-2 text-sm text-body">
          {order.confirmation_email_sent_at
            ? `Recibo enviado el ${formatDate(order.confirmation_email_sent_at)}.`
            : 'Todavía no se ha enviado el recibo de este pedido.'}
        </p>

        {order.email_log?.length ? (
          <ul className="mt-3 space-y-1.5 text-xs text-muted">
            {[...order.email_log]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((entry) => (
                <li key={entry.id}>
                  <span className={entry.status === 'sent' ? 'text-success' : 'text-danger'}>
                    {entry.status === 'sent' ? '✓' : '✗'}
                  </span>{' '}
                  {entry.template} → {entry.to_email} · {formatDate(entry.created_at)}
                  {entry.error ? ` · ${entry.error}` : ''}
                </li>
              ))}
          </ul>
        ) : null}

        <form action={resendOrderConfirmation} className="mt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <button
            type="submit"
            className="min-h-10 rounded-xs border border-ink/25 px-4 text-sm font-medium hover:bg-ivory"
          >
            Reenviar recibo
          </button>
        </form>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Notas internas                                                  */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="notes-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="notes-heading" className="text-h3">Notas internas</h2>
        <p className="text-xs text-muted">Solo visibles para el equipo, nunca para el cliente.</p>
        <form action={saveOrderNotes} className="mt-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label htmlFor="internalNotes" className="sr-only">Notas internas</label>
          <textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            defaultValue={order.internal_notes ?? ''}
            className="w-full rounded-xs border border-line-strong bg-white-warm px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="mt-3 min-h-10 rounded-xs border border-ink/25 px-5 text-sm font-medium transition-colors hover:border-ink"
          >
            Guardar nota
          </button>
        </form>
        {order.customer_notes ? (
          <div className="mt-4 rounded-xs bg-ivory p-3 text-sm text-body">
            <p className="font-semibold text-ink">Nota del cliente</p>
            <p>{order.customer_notes}</p>
          </div>
        ) : null}
      </section>
      <section aria-labelledby="history-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="history-heading" className="text-h3">Historial</h2>
        {order.order_status_history?.length ? <ol className="mt-3 space-y-3">{[...order.order_status_history].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(entry=><li key={entry.id} className="border-l-2 border-rose/40 pl-3 text-sm"><strong>{STATUS_LABEL[entry.new_status] ?? entry.new_status}</strong><p className="text-xs text-muted">{formatDate(entry.created_at)}{entry.note?` · ${entry.note}`:''}</p></li>)}</ol>:<p className="mt-2 text-sm text-muted">Sin cambios registrados.</p>}
      </section>
    </div>
  );
}
