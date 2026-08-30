import { getCurrentUser } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RoleForm } from './role-form';

export const metadata = { title: 'Equipo y permisos' };
export default async function TeamPage() {
  const [me, supabase] = await Promise.all([getCurrentUser(), createServerSupabaseClient()]);
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email, role, status').in('role',['admin','super_admin']).order('created_at');
  return <div><h1 className="font-display text-h2">Equipo y permisos</h1><p className="mt-1 text-sm text-body">Los cambios de rol requieren confirmación y quedan en auditoría.</p>
    {error ? <p className="mt-6 text-danger">{error.message}</p> : <div className="mt-8 overflow-x-auto rounded-sm border border-line"><table className="w-full text-left text-sm"><thead className="bg-white-warm"><tr><th className="px-4 py-3">Persona</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Acción</th></tr></thead><tbody>{data?.map(p=>{const name=[p.first_name,p.last_name].filter(Boolean).join(' ')||p.email; return <tr key={p.id} className="border-t border-line"><td className="px-4 py-3"><strong>{name}</strong><br/><span className="text-muted">{p.email}</span></td><td className="px-4 py-3">{p.role==='super_admin'?'Super admin':'Admin'}</td><td className="px-4 py-3">{me?.role==='super_admin'?<RoleForm id={p.id} role={p.role} name={name}/>:<span className="text-muted">Solo super admin</span>}</td></tr>})}</tbody></table></div>}
  </div>;
}
