'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { emailSchema, loginPasswordSchema } from '@/lib/validation/auth';

const adminLoginSchema = z.object({ email: emailSchema, password: loginPasswordSchema });

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
  const parsed = adminLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Introduce un correo válido y tu contraseña.' };
  }

  const { email, password } = parsed.data;

  // Más estricto que el login de clientas (5/15 min en vez de 5/5 min): es el
  // objetivo de mayor privilegio del sitio.
  const allowed = await checkRateLimit(`admin-login:${email}`, 5, 900);
  if (!allowed) {
    return { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  redirect('/admin');
}
