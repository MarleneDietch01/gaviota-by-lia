import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const metadata = { title: 'Clientes' };

/**
 * Clientes — solo cuentas con el correo confirmado.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ SE FILTRA
 * -----------------------------------------------------------------------------
 * Entre el 1 y el 17 de septiembre de 2026 esta lista mostraba 5 altas de bot
 * y 1 persona real. Nombres de teclado aporreado (`Wxocdo Zlgkqwj`) y correos
 * con los puntos repartidos al azar para burlar el límite de intentos, que iba
 * por la cadena literal (ver `security/rate-limit-keys.ts`). Ninguna confirmó
 * el correo ni inició sesión jamás.
 *
 * Una cuenta sin confirmar NO es una clienta: es una dirección que alguien
 * escribió en un formulario. Mostrarlas junto a las reales no era neutral —
 * con 5 de 6 filas siendo ruido, la pantalla dejaba de servir para lo único
 * que tiene que servir: ver de un vistazo quién te compra.
 *
 * No se ocultan en silencio. Si hay altas sin confirmar se dice cuántas, para
 * que un repunte siga siendo visible en vez de desaparecer detrás del filtro.
 * -----------------------------------------------------------------------------
 * POR QUÉ HACE FALTA EL CLIENTE ADMIN
 * -----------------------------------------------------------------------------
 * `email_confirmed_at` vive en `auth.users`, y ese esquema no está expuesto por
 * PostgREST: `supabase.from('auth.users')` no existe. La API de administración
 * es la vía soportada para leerlo. La página ya corre detrás de
 * `requireAdmin()` en el layout del panel, así que no abre ninguna superficie
 * nueva.
 * -----------------------------------------------------------------------------
 */

/** Ids con el correo confirmado. `null` = no se pudo averiguar. */
async function confirmedUserIds(): Promise<Set<string> | null> {
  try {
    const admin = createAdminSupabaseClient();
    const confirmed = new Set<string>();
    const perPage = 200;

    // Paginado de verdad y no una sola llamada: `listUsers` devuelve 50 por
    // defecto. Con la tienda recién abierta daría igual, pero el día que haya
    // 300 clientas una lectura de una sola página escondería a las más
    // antiguas sin dar ninguna señal de que falta gente.
    for (let page = 1; page <= 25; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return null;

      for (const user of data.users) {
        if (user.email_confirmed_at) confirmed.add(user.id);
      }

      if (data.users.length < perPage) break;
    }

    return confirmed;
  } catch {
    return null;
  }
}

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data, error }, confirmed] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, status, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false }),
    confirmedUserIds(),
  ]);

  const all = data ?? [];

  // Si la comprobación falla se muestran TODAS. Es deliberado: ante un fallo
  // de la API de administración, enseñar de más es un incordio, pero esconder
  // clientas reales sin avisar haría creer que se han perdido cuentas.
  const visible = confirmed ? all.filter((p) => confirmed.has(p.id)) : all;
  const hidden = all.length - visible.length;

  return (
    <div>
      <h1 className="font-display text-h2">Clientes</h1>
      <p className="mt-1 text-sm text-body">
        Cuentas de clientes separadas del equipo administrativo.
      </p>

      {error ? (
        <p className="mt-6 text-danger">{error.message}</p>
      ) : visible.length ? (
        <div className="mt-8 overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-white-warm">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    {[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">{p.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {new Date(p.created_at).toLocaleDateString('es-DO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-sm text-body">Todavía no hay clientes registrados.</p>
      )}

      {hidden > 0 && (
        <p className="mt-4 text-sm text-body">
          {hidden === 1
            ? 'Se oculta 1 cuenta que nunca confirmó su correo.'
            : `Se ocultan ${hidden} cuentas que nunca confirmaron su correo.`}{' '}
          No son clientas: son registros a medias, casi siempre de bots.
        </p>
      )}
    </div>
  );
}
