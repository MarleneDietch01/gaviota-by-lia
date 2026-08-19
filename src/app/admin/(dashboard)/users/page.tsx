import { getCurrentUser } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateUserRole } from './actions';

export const metadata = { title: 'Usuarios' };

const ROLE_LABEL: Record<string, string> = {
  customer: 'Clienta',
  admin: 'Admin',
  super_admin: 'Super admin',
};

export default async function AdminUsersPage() {
  const [me, supabase] = await Promise.all([getCurrentUser(), createServerSupabaseClient()]);
  const canManageRoles = me?.role === 'super_admin';

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-h2">Usuarios</h1>
      <p className="mt-1 text-sm text-body">
        {canManageRoles
          ? 'Puedes cambiar el rol de cualquier cuenta.'
          : 'Solo un super admin puede cambiar roles.'}
      </p>

      {error ? (
        <p className="mt-8 text-sm text-danger">No se pudieron cargar los usuarios: {error.message}</p>
      ) : profiles && profiles.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-white-warm">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                {canManageRoles ? <th className="px-4 py-3 font-semibold">Cambiar rol</th> : null}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-body">{profile.email}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[profile.role] ?? profile.role}</td>
                  <td className="px-4 py-3 text-body">
                    {profile.status === 'active' ? 'Activa' : 'Suspendida'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(profile.created_at).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  {canManageRoles ? (
                    <td className="px-4 py-3">
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={profile.id} />
                        <select
                          name="role"
                          defaultValue={profile.role}
                          className="min-h-9 rounded-xs border border-line-strong bg-white-warm px-2 text-xs"
                        >
                          <option value="customer">Clienta</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super admin</option>
                        </select>
                        <button
                          type="submit"
                          className="min-h-9 rounded-xs border border-ink/25 px-3 text-xs font-semibold transition-colors hover:border-ink"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-sm text-body">Todavía no hay usuarios registrados.</p>
      )}
    </div>
  );
}
