'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isLocale, localizedHref, type Locale } from '@/lib/i18n';

export interface AuthFormState {
  readonly error?: string;
}

const GENERIC_ERROR: Record<Locale, string> = {
  en: 'Incorrect email or password.',
  es: 'Correo o contraseña incorrectos.',
};

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  if (!email || !password) {
    return { error: lang === 'es' ? 'Introduce correo y contraseña.' : 'Enter your email and password.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: GENERIC_ERROR[lang] };
  }

  redirect(localizedHref(lang, '/account'));
}
