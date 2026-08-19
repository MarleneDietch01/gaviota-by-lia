'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface LoginState {
  readonly error?: string;
}

/**
 * Inicio de sesión del panel.
 *
 * No comprueba el rol aquí: `signInWithPassword` solo verifica la contraseña.
 * El guard de `(dashboard)/layout.tsx` (`requireAdmin`) es quien decide si la
 * sesión recién creada tiene permiso para entrar — así cualquier cuenta
 * `customer` que intente entrar ve exactamente el mismo layout protegido
 * expulsarla, en vez de dos caminos de autorización distintos que mantener.
 */
export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Introduce correo y contraseña.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  redirect('/admin');
}
