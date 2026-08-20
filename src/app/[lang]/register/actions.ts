'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { registerSchema } from '@/lib/validation/auth';
import { isLocale, localizedHref, type Locale } from '@/lib/i18n';

export interface RegisterState {
  readonly error?: string;
  /** true => cuenta creada, esperando confirmación por correo. */
  readonly awaitingConfirmation?: boolean;
}

export async function signUp(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    lang,
  });

  if (!parsed.success) {
    const passwordTooShort = parsed.error.issues.some(
      (issue) => issue.path[0] === 'password' && issue.message === 'too_short',
    );

    return {
      error: passwordTooShort
        ? lang === 'es'
          ? 'La contraseña debe tener al menos 8 caracteres.'
          : 'Password must be at least 8 characters.'
        : lang === 'es'
          ? 'Completa correo, contraseña y nombre correctamente.'
          : 'Fill in a valid email, password and first name.',
    };
  }

  const { email, password, firstName, lastName } = parsed.data;

  // 3 registros por email cada 10 minutos: no evita que alguien registre
  // cuentas distintas en masa (eso lo frena Supabase Auth por IP), pero sí
  // evita reintentar el mismo correo en bucle.
  const allowed = await checkRateLimit(`register:${email}`, 3, 600);
  if (!allowed) {
    return {
      error:
        lang === 'es'
          ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
          : 'Too many attempts. Wait a few minutes and try again.',
    };
  }

  const supabase = await createServerSupabaseClient();

  // El rol NUNCA se manda aquí: `handle_new_user` lo fuerza a 'customer' en
  // servidor sin mirar estos metadatos, aunque alguien intentara inyectar
  // `role` en el formulario (ver `0003_profiles_addresses.sql`).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName || null } },
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists')
        ? lang === 'es'
          ? 'Ya existe una cuenta con ese correo.'
          : 'An account with that email already exists.'
        : lang === 'es'
          ? 'No se pudo crear la cuenta. Inténtalo de nuevo.'
          : 'Could not create the account. Please try again.';
    return { error: message };
  }

  // Con confirmación de correo deshabilitada, `signUp` ya deja sesión activa.
  // Con confirmación habilitada (configuración por defecto de Supabase),
  // `session` viene null hasta que la persona confirme.
  if (data.session) {
    redirect(localizedHref(lang, '/account'));
  }

  return { awaitingConfirmation: true };
}
