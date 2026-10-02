import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Suscriptoras' };

/**
 * Suscriptoras de novedades y avisos de reposición pendientes.
 *
 * Solo lectura. Las dos listas se leen con la sesión de la administradora: las
 * políticas `*_admin_*` de ambas tablas ya exigen `is_admin()`.
 *
 * La lista de novedades es una lista de contactos, no una herramienta de
 * envío: para mandar una campaña, cada correo debe llevar el enlace
 * `/{idioma}/unsubscribe/{unsubscribe_token}` de su destinataria.
 */
export default async function SubscribersPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: subscribers, error }, { data: alerts }] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id, email, source, subscribed_at')
      .eq('status', 'subscribed')
      .order('subscribed_at', { ascending: false }),
    supabase
      .from('back_in_stock_requests')
      .select('product_id, products ( name )')
      .is('notified_at', null),
  ]);

  const pendingByProduct = new Map<string, number>();
  for (const alert of alerts ?? []) {
    const name = alert.products?.name ?? '—';
    pendingByProduct.set(name, (pendingByProduct.get(name) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-display text-h2">Suscriptoras</h1>
      <p className="mt-1 text-sm text-body">
        Correos dejados en la portada y avisos de reposición que esperan stock.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Avisos de reposición pendientes</h2>
      {pendingByProduct.size ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {[...pendingByProduct].map(([name, count]) => (
            <li key={name}>
              <span className="font-semibold">{name}</span>: {count}{' '}
              {count === 1 ? 'persona espera' : 'personas esperan'} el aviso
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nadie está esperando un aviso ahora mismo.</p>
      )}
      <p className="mt-2 text-xs text-muted">
        El correo sale solo al ajustar el stock del producto por encima de 0 en Productos.
      </p>

      <h2 className="mt-10 text-lg font-semibold">
        Novedades{subscribers?.length ? ` (${subscribers.length})` : ''}
      </h2>
      {error ? (
        <p className="mt-3 text-danger">{error.message}</p>
      ) : subscribers?.length ? (
        <div className="mt-3 overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-white-warm">
              <tr>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Idioma</th>
                <th className="px-4 py-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.source?.endsWith(':en') ? 'Inglés' : 'Español'}</td>
                  <td className="px-4 py-3">{new Date(s.subscribed_at).toLocaleDateString('es-DO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Todavía no hay suscriptoras.</p>
      )}
    </div>
  );
}
