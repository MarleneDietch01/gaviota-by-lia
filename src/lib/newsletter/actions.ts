'use server';

import { checkRateLimit } from '@/lib/security/rate-limit';
import { subscribeToNewsletter } from '@/lib/resend';
import { newsletterSchema } from '@/lib/validation/newsletter';
import { isLocale, type Locale } from '@/lib/i18n';

export interface NewsletterState {
  readonly error?: string;
  readonly success?: boolean;
}

export async function subscribeNewsletter(_prevState: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'en';

  const parsed = newsletterSchema.safeParse({ email: formData.get('email'), lang });
  if (!parsed.success) {
    return {
      error: lang === 'es' ? 'Ingresa un correo válido.' : 'Enter a valid email address.',
    };
  }

  const { email } = parsed.data;

  const allowed = await checkRateLimit(`newsletter:${email}`, 3, 600);
  if (!allowed) {
    return {
      error:
        lang === 'es'
          ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
          : 'Too many attempts. Wait a few minutes and try again.',
    };
  }

  const result = await subscribeToNewsletter(email);
  if (!result.ok) {
    return {
      error:
        lang === 'es'
          ? 'No pudimos completar la suscripción. Inténtalo de nuevo más tarde.'
          : "We couldn't complete the subscription. Please try again later.",
    };
  }

  return { success: true };
}
