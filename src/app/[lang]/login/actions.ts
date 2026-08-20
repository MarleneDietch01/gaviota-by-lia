'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { loginSchema } from '@/lib/validation/auth';
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

const MISSING_FIELDS: Record<Locale, string> = {
  en: 'Enter a valid email and password.',
  es: 'Introduce un correo válido y tu contraseña.',
};

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    lang,
  });

  if (!parsed.success) {
    return { error: MISSING_FIELDS[lang] };
  }

  const { email, password } = parsed.data;

  // 5 intentos por email cada 5 minutos: el vector de fuerza bruta más común
  // contra un login es probar contraseñas repetidas sobre la MISMA cuenta.
  const allowed = await checkRateLimit(`login:${email}`, 5, 300);
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
