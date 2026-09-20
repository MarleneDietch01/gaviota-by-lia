'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { rateLimitEmailKey, requestIp } from '@/lib/security/rate-limit-keys';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { isLocale, type Locale } from '@/lib/i18n';

export interface ForgotPasswordState {
  readonly error?: string;
  readonly sent?: boolean;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email'), lang });

  if (!parsed.success) {
    return { error: lang === 'es' ? 'Introduce un correo válido.' : 'Enter a valid email.' };
  }

  const { email } = parsed.data;

  // 3 correos por BUZÓN cada 10 minutos, más 10 por IP cada hora. El resultado
  // visible es SIEMPRE "sent: true" pase lo que pase (exista la cuenta o no,
  // esté limitado o no): devolver un mensaje distinto cuando se excede el
  // límite delataría que ese correo sí está siendo bombardeado con intento
  // tras intento, que es información suficiente para confirmar que la cuenta
  // existe. Por eso los dos límites de abajo solo deciden si se manda el
  // correo, nunca lo que se responde.
  //
  // La clave era el correo literal y eso no bastaba: Gmail ignora los puntos,
  // así que repartiéndolos de otra forma se estrenaba contador una y otra vez
  // contra la MISMA clienta. Quien recibe ese bombardeo es una persona real
  // registrada aquí, y lo que ve es su bandeja llena de "restablece tu
  // contraseña" de una tienda donde compró. `rateLimitEmailKey()` reduce todas
  // esas variantes al buzón que de verdad las recibe.
  const allowedForMailbox = await checkRateLimit(
    `forgot-password:${rateLimitEmailKey(email)}`,
    3,
    600,
  );

  // Y el de IP frena al mismo origen probando direcciones distintas a ver
  // cuáles están registradas.
  const allowedForIp = allowedForMailbox
    ? await checkRateLimit(`forgot-password-ip:${await requestIp()}`, 10, 3600)
    : false;

  if (allowedForMailbox && allowedForIp) {
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
