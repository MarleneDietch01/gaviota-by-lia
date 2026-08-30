import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Clientes' };
export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles')
    .select('id, first_name, last_name, email, phone, status, created_at')
    .eq('role', 'customer').order('created_at', { ascending: false });
  return <div><h1 className="font-display text-h2">Clientes</h1><p className="mt-1 text-sm text-body">Cuentas de clientes separadas del equipo administrativo.</p>
    {error ? <p className="mt-6 text-danger">{error.message}</p> : data?.length ? <div className="mt-8 overflow-x-auto rounded-sm border border-line"><table className="w-full text-left text-sm"><thead className="bg-white-warm"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Alta</th></tr></thead><tbody>{data.map((p)=><tr key={p.id} className="border-t border-line"><td className="px-4 py-3">{[p.first_name,p.last_name].filter(Boolean).join(' ') || '—'}</td><td className="px-4 py-3">{p.email}</td><td className="px-4 py-3">{p.phone || '—'}</td><td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString('es-DO')}</td></tr>)}</tbody></table></div> : <p className="mt-8 text-sm text-body">Todavía no hay clientes registrados.</p>}
  </div>;
}
