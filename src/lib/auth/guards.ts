import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

/** Error de autorización. Las capas superiores lo traducen a 401/403. */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN',
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Devuelve el usuario actual, o `null` si no hay sesión.
 *
 * El rol se lee SIEMPRE de la tabla `profiles`, nunca del JWT ni de una cookie.
 * Dos razones:
 *   1. Lo que viene del cliente es manipulable.
 *   2. Un rol dentro del token queda obsoleto: degradar a un administrador no
 *      tendría efecto hasta que caducara su sesión.
 *
 * Se usa `getUser()` y no `getSession()`: `getUser()` valida el token contra el
 * servidor de Supabase; `getSession()` se limita a leer la cookie.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name, status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Una cuenta suspendida no es una cuenta activa, tenga o no sesión válida.
  if (profile.status !== 'active') {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

/** Exige sesión. Lanza si no la hay. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthorizationError('Se requiere iniciar sesión', 'UNAUTHENTICATED');
  }

  return user;
}

/**
 * Exige rol de administrador.
 *
 * Se llama al principio de CADA Server Action de administración, no solo en el
 * layout. Una Server Action es un endpoint HTTP invocable directamente: proteger
 * únicamente `/admin/layout.tsx` deja todas las acciones abiertas a quien
 * conozca su identificador.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AuthorizationError(
      'Se requieren permisos de administrador',
      'FORBIDDEN',
    );
  }

  return user;
}

/** Exige rol de super administrador (auditoría, gestión de roles). */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== 'super_admin') {
    throw new AuthorizationError(
      'Se requieren permisos de super administrador',
      'FORBIDDEN',
    );
  }

  return user;
}

/** Comprobación sin lanzar, para renderizado condicional. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin' || user?.role === 'super_admin';
}
