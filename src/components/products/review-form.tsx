'use client';

import { useActionState } from 'react';
import { submitReview, type ReviewFormState } from '@/app/[lang]/products/[slug]/actions';
import type { Locale } from '@/lib/i18n';

const initialState: ReviewFormState = {};

export function ReviewForm({ slug, locale }: { slug: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState(submitReview, initialState);

  if (state.success) {
    return (
      <div role="status" className="rounded-sm border border-line bg-white-warm p-5 text-sm text-body">
        {locale === 'es'
          ? 'Gracias. Tu reseña quedó enviada y se publicará después de revisarla.'
          : 'Thanks. Your review was submitted and will publish after moderation.'}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-line bg-white-warm p-5 sm:p-6">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="slug" value={slug} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Calificación' : 'Rating'}
        </span>
        <select
          name="rating"
          required
          defaultValue=""
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        >
          <option value="" disabled>
            {locale === 'es' ? 'Elige una calificación' : 'Choose a rating'}
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {locale === 'es' ? (n === 1 ? 'estrella' : 'estrellas') : n === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Título (opcional)' : 'Title (optional)'}
        </span>
        <input
          type="text"
          name="title"
          maxLength={120}
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Tu comentario' : 'Your review'}
        </span>
        <textarea
          name="content"
          required
          rows={4}
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
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xs bg-rose text-sm font-semibold text-white-warm transition-colors duration-300 hover:bg-rose-deep disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending
          ? locale === 'es'
            ? 'Enviando…'
            : 'Submitting…'
          : locale === 'es'
            ? 'Enviar reseña'
            : 'Submit review'}
      </button>
    </form>
  );
}
