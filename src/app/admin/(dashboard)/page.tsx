import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';

export const metadata = { title: 'Panel' };

const STAT_CARD = 'rounded-sm border border-line bg-white-warm p-5';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const [{ count: orderCount }, { count: pendingCount }, { count: customerCount }, { data: paidOrders }] =
    await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('order_status', 'pending_payment'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('grand_total').eq('payment_status', 'paid'),
    ]);

  const revenueCents = (paidOrders ?? []).reduce((sum, row) => sum + row.grand_total, 0);

  return (
    <div>
      <h1 className="font-display text-h2">Panel</h1>
      <p className="mt-1 text-sm text-body">Estado general de la tienda.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={STAT_CARD}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Pedidos totales</p>
          <p className="tabular mt-2 text-2xl font-semibold">{orderCount ?? 0}</p>
        </div>
        <div className={STAT_CARD}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Pago pendiente</p>
          <p className="tabular mt-2 text-2xl font-semibold">{pendingCount ?? 0}</p>
        </div>
        <div className={STAT_CARD}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Clientas</p>
          <p className="tabular mt-2 text-2xl font-semibold">{customerCount ?? 0}</p>
        </div>
        <div className={STAT_CARD}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Ingresos cobrados</p>
          <p className="tabular mt-2 text-2xl font-semibold">
            {formatMoney(cents(revenueCents), 'USD', 'es-US')}
          </p>
        </div>
      </div>
    </div>
  );
}
