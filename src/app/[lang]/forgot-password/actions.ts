'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { isLocale, type Locale } from '@/lib/i18n';

export interface ForgotPasswordState {
  readonly error?: string;
  readonly sent?: boolean;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim();
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  if (!email) {
    return { error: lang === 'es' ? 'Introduce tu correo.' : 'Enter your email.' };
  }

  // 3 correos por dirección cada 10 minutos. El resultado visible es SIEMPRE
  // "sent: true" pase lo que pase (exista la cuenta o no, esté limitado o no):
  // devolver un mensaje distinto cuando se excede el límite delataría que ese
  // correo sí está siendo bombardeado con intento tras intento, que es
  // información suficiente para confirmar que la cuenta existe.
  const allowed = await checkRateLimit(`forgot-password:${email.toLowerCase()}`, 3, 600);

  if (allowed) {
    const supabase = await createServerSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    // Siempre se devuelve éxito, exista o no la cuenta: confirmar por el
    // mensaje de error si un correo está registrado es una fuga de datos.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/${lang}/reset-password`,
    });
  }

  return { sent: true };
}
