'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { isLocale, localizedHref, type Locale } from '@/lib/i18n';

export interface AuthFormState {
  readonly error?: string;
}

const GENERIC_ERROR: Record<Locale, string> = {
  en: 'Incorrect email or password.',
  es: 'Correo o contraseña incorrectos.',
};

const TOO_MANY_ATTEMPTS: Record<Locale, string> = {
  en: 'Too many attempts. Wait a few minutes and try again.',
  es: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  if (!email || !password) {
    return { error: lang === 'es' ? 'Introduce correo y contraseña.' : 'Enter your email and password.' };
  }

  // 5 intentos por email cada 5 minutos: el vector de fuerza bruta más común
  // contra un login es probar contraseñas repetidas sobre la MISMA cuenta.
  const allowed = await checkRateLimit(`login:${email.toLowerCase()}`, 5, 300);
  if (!allowed) {
    return { error: TOO_MANY_ATTEMPTS[lang] };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: GENERIC_ERROR[lang] };
  }

  redirect(localizedHref(lang, '/account'));
}
