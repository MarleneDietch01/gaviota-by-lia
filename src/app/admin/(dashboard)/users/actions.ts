'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ASSIGNABLE_ROLES = ['customer', 'admin', 'super_admin'] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

function isAssignableRole(value: string): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/**
 * Cambia el rol de un perfil.
 *
 * Solo `super_admin` puede llamarla — `requireSuperAdmin()` es la misma
 * comprobación que ya usan el resto de acciones sensibles. El trigger
 * `prevent_role_escalation` de la base de datos es la segunda barrera: aunque
 * esta función tuviera un fallo, la actualización se rechaza en el motor si
 * quien la ejecuta no es admin/super_admin.
 */
export async function updateUserRole(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');

  if (!userId || !isAssignableRole(role)) {
    throw new Error('Datos inválidos');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);

  if (error) {
    throw new Error(`No se pudo actualizar el rol: ${error.message}`);
  }

  revalidatePath('/admin/users');
}
