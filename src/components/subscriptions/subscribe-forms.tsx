'use client';

import { useActionState, useId } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import {
  requestBackInStock,
  subscribeNewsletter,
  type SubscriptionState,
} from '@/lib/subscriptions/actions';
import { cn } from '@/lib/utils/cn';

const initialState: SubscriptionState = {};

const fieldClass =
  'min-h-12 w-full min-w-0 rounded-xs border border-line-strong bg-white-warm px-4 text-sm text-ink transition-colors focus:border-gold-deep';

/** Señuelo: fuera de pantalla y fuera del orden de tabulación. */
function Honeypot() {
  return (
    <label className="absolute -left-[9999px]" aria-hidden="true">
      Company
      <input type="text" name="company" tabIndex={-1} autoComplete="off" />
    </label>
  );
}

function Done({ message, className }: { message: string | undefined; className?: string }) {
  return (
    <p role="status" className={cn('flex items-start gap-2 text-sm font-medium text-success', className)}>
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/**
 * Alta de novedades, en el bloque "Únete a la comunidad" de la portada.
 * No promete descuento: no hay ninguno aprobado para suscriptoras.
 */
export function NewsletterForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);
  const inputId = useId();

  if (state.status === 'success') return <Done message={state.message} className="justify-center" />;

  return (
    <form action={formAction} className="relative mx-auto w-full max-w-md text-left">
      <input type="hidden" name="lang" value={locale} />
      <Honeypot />
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-body">
        {pick(locale, 'Your email', 'Tu correo')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          className={fieldClass}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          aria-invalid={state.status === 'error' || undefined}
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? pick(locale, 'Saving…', 'Guardando…') : pick(locale, 'Subscribe', 'Suscribirme')}
        </Button>
      </div>
      {state.status === 'error' ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">{state.message}</p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {pick(locale, 'Unsubscribe in one click from any email. ', 'Te das de baja con un clic desde cualquier correo. ')}
        <Link href={localizedHref(locale, '/privacy-policy')} className="underline underline-offset-2 hover:text-ink">
          {pick(locale, 'Privacy policy', 'Política de privacidad')}
        </Link>
      </p>
    </form>
  );
}

/** "Avísame cuando vuelva", en la ficha de un producto agotado. */
export function BackInStockForm({ slug, locale }: { slug: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState(requestBackInStock, initialState);
  const inputId = useId();

  if (state.status === 'success') return <Done message={state.message} />;

  return (
    <form action={formAction} className="relative">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      <Honeypot />
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink">
        {pick(locale, 'Email me when it’s back', 'Avísame cuando vuelva')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          className={fieldClass}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={pick(locale, 'you@email.com', 'tu@correo.com')}
          aria-invalid={state.status === 'error' || undefined}
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? pick(locale, 'Saving…', 'Guardando…') : pick(locale, 'Notify me', 'Avisarme')}
        </Button>
      </div>
      {state.status === 'error' ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">{state.message}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          {pick(locale, 'One email, only for this product.', 'Un solo correo, solo sobre este producto.')}
        </p>
      )}
    </form>
  );
}
