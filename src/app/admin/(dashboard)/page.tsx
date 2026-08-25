import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';

export const metadata = { title: 'Panel' };

/**
 * Panel — rediseño 2026-08.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ CAMBIARON LAS MÉTRICAS
 *
 * La versión anterior mostraba "Pedidos totales: N" contando TODAS las filas
 * de `orders`, incluidas las de `pending_payment` — que en la base de datos
 * real de este proyecto son, hoy, 29 de 31 filas: carritos abandonados con el
 * email de relleno `sin-correo@pendiente.gaviotabylia.com`, no ventas. Una
 * cifra así lleva a leer "vendí 31" cuando la realidad es "vendí 2". Estas
 * filas de prueba NO SE BORRARON — no se puede: `order_status_history` tiene
 * un trigger `forbid_mutation()` que rechaza UPDATE/DELETE incluso desde
 * `service_role`, y es un control de auditoría deliberado, no un descuido (ver
 * el comentario de su propia migración). El arreglo es de consulta, no de
 * datos: cada tarjeta de abajo filtra por el criterio real que la hace
 * verdadera, no por "toda la tabla".
 *
 * También se excluye cualquier email `@gaviotabylia.test` de todo lo que
 * toque ingresos — hay una fila de prueba marcada `paid` con ese dominio, y
 * contarla como ingreso real sería el mismo error que "Pedidos totales" solo
 * que con dinero.
 * -----------------------------------------------------------------------------
 * POR QUÉ CAMBIÓ EL DISEÑO
 *
 * La versión anterior eran cuatro tarjetas idénticas sobre un vacío enorme.
 * Ahora lo primero que se ve es una lista de ACCIONES ("qué hacer hoy"), no
 * solo cifras — pedidos por enviar, reseñas por moderar, productos agotados,
 * cada una con su enlace directo. Las cifras de negocio (pagados, ingresos
 * del mes, carritos abandonados) van debajo, con jerarquía real: pagados e
 * ingresos son grandes, carritos abandonados lleva su propia etiqueta para
 * que no se confunda con una venta. Los pedidos recientes cierran la página
 * con acceso directo a cada ficha.
 * -----------------------------------------------------------------------------
 */

const TEST_EMAIL_SUFFIX = '@gaviotabylia.test';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: paidCount },
    { count: pendingShipmentCount },
    { count: abandonedCount },
    { data: monthlyPaidOrders },
    { count: disputedCount },
    { count: pendingReviewsCount },
    { data: variantsWithProducts },
    { data: recentOrders },
  ] = await Promise.all([
    // Pedidos pagados: lo que de verdad se vendió, sin importar en qué punto
    // del despacho estén.
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'paid')
      .not('customer_email', 'ilike', `%${TEST_EMAIL_SUFFIX}`),
    // Pendientes de enviar: pagados que aún no salieron de la tienda. Es la
    // cifra que dice qué hacer HOY, no cuánto se vendió en total.
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'paid')
      .in('order_status', ['paid', 'processing', 'ready_to_ship']),
    // Carritos abandonados: `pending_payment`, etiquetados como tal y APARTE
    // de cualquier cifra de venta — nunca se suman a "pagados".
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_status', 'pending_payment'),
    supabase
      .from('orders')
      .select('grand_total, customer_email')
      .eq('payment_status', 'paid')
      .gte('created_at', startOfMonth.toISOString()),
    // Ver el comentario en el dashboard original: sigue siendo el respaldo
    // dentro del sitio, no el mecanismo principal de gestión de disputas.
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('products')
      .select('id, track_inventory, product_variants(stock_quantity, reserved_quantity)')
      .eq('status', 'active'),
    supabase
      .from('orders')
      .select('id, order_number, customer_email, grand_total, order_status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const monthlyRevenueCents = (monthlyPaidOrders ?? [])
    .filter((o) => !o.customer_email.toLowerCase().endsWith(TEST_EMAIL_SUFFIX))
    .reduce((sum, row) => sum + row.grand_total, 0);

  const outOfStockProducts = (variantsWithProducts ?? []).filter((product) => {
    if (!product.track_inventory) return false;
    const variant = product.product_variants?.[0];
    if (!variant) return false;
    return variant.stock_quantity - variant.reserved_quantity <= 0;
  });

  const hasActionItems =
    (pendingShipmentCount ?? 0) > 0 || (pendingReviewsCount ?? 0) > 0 || outOfStockProducts.length > 0;

  return (
    <div>
      <h1 className="font-display text-h2">Panel</h1>
      <p className="mt-1 text-sm text-body">Lo que necesita tu atención hoy.</p>

      {disputedCount ? (
        <div className="mt-6 rounded-sm border border-danger/40 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-danger">
            {disputedCount} {disputedCount === 1 ? 'pago en disputa' : 'pagos en disputa'} — revisa y responde
            en el dashboard de Stripe/PayPal antes de que venza el plazo.
          </p>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Qué hacer hoy — acciones, no solo cifras                          */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="today-heading" className="mt-8">
        <h2 id="today-heading" className="text-h3">Hoy</h2>
        {hasActionItems ? (
          <ul className="mt-4 space-y-3">
            {(pendingShipmentCount ?? 0) > 0 ? (
              <li>
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-between gap-4 rounded-sm border border-rose/30 bg-powder/25 p-4 transition-colors hover:bg-powder/40"
                >
                  <span>
                    <span className="block font-semibold text-ink">
                      {pendingShipmentCount} {pendingShipmentCount === 1 ? 'pedido pagado por enviar' : 'pedidos pagados por enviar'}
                    </span>
                    <span className="text-sm text-body">Marca cada uno como enviado y registra el rastreo.</span>
                  </span>
                  <span aria-hidden="true" className="text-rose-deep">→</span>
                </Link>
              </li>
            ) : null}

            {(pendingReviewsCount ?? 0) > 0 ? (
              <li>
                <Link
                  href="/admin/reviews"
                  className="flex items-center justify-between gap-4 rounded-sm border border-line bg-white-warm p-4 transition-colors hover:bg-ivory"
                >
                  <span>
                    <span className="block font-semibold text-ink">
                      {pendingReviewsCount} {pendingReviewsCount === 1 ? 'reseña pendiente de moderar' : 'reseñas pendientes de moderar'}
                    </span>
                    <span className="text-sm text-body">Apruébalas o recházalas antes de que se publiquen.</span>
                  </span>
                  <span aria-hidden="true" className="text-rose-deep">→</span>
                </Link>
              </li>
            ) : null}

            {outOfStockProducts.length > 0 ? (
              <li>
                <Link
                  href="/admin/products"
                  className="flex items-center justify-between gap-4 rounded-sm border border-line bg-white-warm p-4 transition-colors hover:bg-ivory"
                >
                  <span>
                    <span className="block font-semibold text-ink">
                      {outOfStockProducts.length} {outOfStockProducts.length === 1 ? 'producto agotado' : 'productos agotados'}
                    </span>
                    <span className="text-sm text-body">No se pueden comprar hasta que repongas el stock.</span>
                  </span>
                  <span aria-hidden="true" className="text-rose-deep">→</span>
                </Link>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-4 rounded-sm border border-line bg-white-warm p-5 text-sm text-body">
            No hay nada urgente pendiente: sin pedidos por enviar, sin reseñas por moderar y sin productos agotados.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Números del negocio — jerarquía real, no cuatro tarjetas iguales  */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="numbers-heading" className="mt-10">
        <h2 id="numbers-heading" className="text-h3">Este mes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-line bg-white-warm p-5 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Ingresos del mes</p>
            <p className="tabular mt-2 text-3xl font-semibold text-ink">
              {formatMoney(cents(monthlyRevenueCents), 'USD', 'es-US')}
            </p>
            <p className="mt-1 text-xs text-muted">Solo pedidos pagados, sin las filas de prueba.</p>
          </div>
          <div className="rounded-sm border border-line bg-white-warm p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Pedidos pagados</p>
            <p className="tabular mt-2 text-2xl font-semibold">{paidCount ?? 0}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-line bg-white-warm p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Pendientes de enviar</p>
            <p className="tabular mt-2 text-2xl font-semibold">{pendingShipmentCount ?? 0}</p>
          </div>
          <div className="rounded-sm border border-dashed border-line-strong bg-ivory p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Carritos abandonados</p>
            <p className="tabular mt-2 text-2xl font-semibold text-muted">{abandonedCount ?? 0}</p>
            <p className="mt-1 text-xs text-muted">Pago nunca completado — no son ventas.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pedidos recientes                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-h3">Pedidos recientes</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-rose hover:text-rose-deep">
            Ver todos
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <ul className="mt-4 divide-y divide-line rounded-sm border border-line bg-white-warm">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-ivory"
                >
                  <span className="tabular font-medium">{order.order_number}</span>
                  <span className="text-sm text-body">{order.customer_email}</span>
                  <span className="tabular text-sm font-semibold">
                    {formatMoney(cents(order.grand_total), 'USD', 'es-US')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-sm border border-line bg-white-warm p-5 text-sm text-body">
            Aún no hay pedidos.
          </p>
        )}
      </section>
    </div>
  );
}
