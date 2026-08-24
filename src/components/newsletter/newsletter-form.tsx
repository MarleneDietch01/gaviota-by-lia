'use client';

import { useActionState } from 'react';
import { subscribeNewsletter, type NewsletterState } from '@/lib/newsletter/actions';
import { pick, type Locale } from '@/lib/i18n';

const initialState: NewsletterState = {};

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);

  if (state.success) {
    return (
      <p role="status" className="text-sm text-on-dark-soft">
        {pick(locale, "You're subscribed. Thank you!", '¡Ya estás suscrita! Gracias.')}
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-sm">
      <input type="hidden" name="lang" value={locale} />
      <label htmlFor="newsletter-email" className="mb-1.5 block text-xs font-semibold text-on-dark-soft">
        {pick(locale, 'Join our list', 'Únete a nuestra lista')}
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={pick(locale, 'you@email.com', 'tu@correo.com')}
          className="min-h-11 w-full rounded-xs border border-on-dark-soft/40 bg-transparent px-3.5 text-sm text-on-dark placeholder:text-on-dark-soft/70"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xs bg-white-warm px-5 text-sm font-semibold text-wine transition-colors hover:bg-powder disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? pick(locale, 'Joining…', 'Uniendo…') : pick(locale, 'Subscribe', 'Suscribir')}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-on-dark">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
