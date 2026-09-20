'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { rateLimitEmailKey, requestIp } from '@/lib/security/rate-limit-keys';
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

  const tooManyAttempts = {
    error:
      lang === 'es'
        ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
        : 'Too many attempts. Wait a few minutes and try again.',
  };

  // DOS límites, porque cierran agujeros distintos y ninguno basta solo.
  //
  // 1) Por buzón canónico. Antes la clave era el correo literal, y eso lo
  //    burlaron: Gmail ignora los puntos, así que `a.c.uyemi@gmail.com` y
  //    `ac.u.yemi@gmail.com` son el mismo destinatario pero eran dos cubos
  //    distintos, cada uno con sus 3 intentos. `rateLimitEmailKey()` los
  //    reduce al mismo cubo. Ver el detalle en `security/rate-limit-keys.ts`.
  const allowedForMailbox = await checkRateLimit(
    `register:${rateLimitEmailKey(email)}`,
    3,
    600,
  );
  if (!allowedForMailbox) return tooManyAttempts;

  // 2) Por IP. Lo anterior no frena a quien use direcciones realmente
  //    distintas, que es justo lo que pasó: cinco buzones ajenos dados de alta
  //    en tres semanas. 5 altas por hora desde un mismo origen es holgado para
  //    una familia compartiendo wifi y estrecho para un bot.
  //
  //    Va DESPUÉS del de buzón a propósito: así un reintento del mismo correo
  //    se para en el primer límite sin gastar cupo del segundo, y una persona
  //    que se equivoca de contraseña tres veces no deja sin registro al resto
  //    de su casa.
  const allowedForIp = await checkRateLimit(`register-ip:${await requestIp()}`, 5, 3600);
  if (!allowedForIp) return tooManyAttempts;

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
