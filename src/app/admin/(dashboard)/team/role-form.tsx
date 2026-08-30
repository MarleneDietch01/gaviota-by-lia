'use client';
import { useFormStatus } from 'react-dom';
import { updateUserRole } from '../users/actions';

function Button() { const { pending } = useFormStatus(); return <button disabled={pending} className="min-h-9 rounded-xs border border-ink/25 px-3 text-xs font-semibold disabled:opacity-50">{pending ? 'Guardando…' : 'Cambiar rol'}</button>; }
export function RoleForm({ id, role, name }: { id: string; role: string; name: string }) {
  return <form action={updateUserRole} onSubmit={(e) => { if (!confirm(`¿Confirmas cambiar el rol de ${name}?`)) e.preventDefault(); }} className="flex gap-2">
    <input type="hidden" name="userId" value={id}/><input type="hidden" name="confirmed" value="yes"/>
    <select name="role" defaultValue={role} className="min-h-9 rounded-xs border border-line-strong bg-white-warm px-2 text-xs"><option value="admin">Admin</option><option value="super_admin">Super admin</option></select><Button/>
  </form>;
}
