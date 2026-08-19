import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';

export const metadata = { title: 'Pedidos' };

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

const STATUS_TONE: Record<string, string> = {
  pending_payment: 'bg-line text-body',
  paid: 'bg-success/15 text-success',
  processing: 'bg-champagne/25 text-ink',
  ready_to_ship: 'bg-champagne/25 text-ink',
  shipped: 'bg-rose/15 text-rose-deep',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-danger/10 text-danger',
  refunded: 'bg-danger/10 text-danger',
  partially_refunded: 'bg-danger/10 text-danger',
};

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, grand_total, order_status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-h2">Pedidos</h1>
      <p className="mt-1 text-sm text-body">Los 100 más recientes.</p>

      {error ? (
        <p className="mt-8 text-sm text-danger">No se pudieron cargar los pedidos: {error.message}</p>
      ) : orders && orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-white-warm">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Clienta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="tabular px-4 py-3 font-medium">{order.order_number}</td>
                  <td className="px-4 py-3 text-body">{order.customer_email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[order.order_status] ?? 'bg-line text-body'}`}
                    >
                      {STATUS_LABEL[order.order_status] ?? order.order_status}
                    </span>
                  </td>
                  <td className="tabular px-4 py-3 text-right font-semibold">
                    {formatMoney(cents(order.grand_total), 'USD', 'es-US')}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(order.created_at).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-sm text-body">Todavía no hay pedidos.</p>
      )}
    </div>
  );
}
