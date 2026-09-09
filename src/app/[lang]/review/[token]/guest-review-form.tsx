'use client';

import { useActionState } from 'react';
import { submitGuestReview, type GuestReviewState } from './actions';
import type { Locale } from '@/lib/i18n';

const initialState: GuestReviewState = {};

/**
 * Mismo formulario que `ReviewForm`, pero autorizado por el token del enlace
 * en vez de por la sesión. El token viaja en un campo oculto y la acción lo
 * vuelve a verificar: aquí no se manda ni el producto ni el pedido.
 */
export function GuestReviewForm({ token, locale }: { token: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState(submitGuestReview, initialState);
  const t = (en: string, es: string) => (locale === 'es' ? es : en);

  if (state.success) {
    return (
      <div role="status" className="rounded-sm border border-line bg-white-warm p-6 text-sm text-body">
        {t(
          'Thank you. Your review was submitted and will publish after we read it.',
          'Gracias. Tu reseña quedó enviada y se publicará después de que la leamos.',
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-line bg-white-warm p-5 sm:p-6">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="token" value={token} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">{t('Rating', 'Calificación')}</span>
        <select
          name="rating"
          required
          defaultValue=""
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        >
          <option value="" disabled>
            {t('Choose a rating', 'Elige una calificación')}
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {locale === 'es' ? (n === 1 ? 'estrella' : 'estrellas') : n === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">{t('Title (optional)', 'Título (opcional)')}</span>
        <input
          type="text"
          name="title"
          maxLength={120}
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">{t('Your review', 'Tu comentario')}</span>
        <textarea
          name="content"
          required
          rows={5}
          maxLength={2000}
          className="w-full rounded-xs border border-line-strong bg-white-warm p-4 text-sm"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xs bg-champagne text-sm font-semibold text-ink transition-colors duration-300 hover:bg-gold disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? t('Submitting…', 'Enviando…') : t('Submit review', 'Enviar reseña')}
      </button>
    </form>
  );
}
