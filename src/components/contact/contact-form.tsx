'use client';

import { useActionState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitContact, type ContactState } from '@/lib/contact/actions';
import { pick, type Locale } from '@/lib/i18n';

const initialState: ContactState = {};
const fieldClass =
  'min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm text-ink transition-colors focus:border-rose';

export function ContactForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

  if (state.status === 'success') {
    return (
      <div role="status" className="flex min-h-72 flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-pill bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-h3">{pick(locale, 'Message sent', 'Mensaje enviado')}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-body">{state.message}</p>
      </div>
    );
  }

  const errorFor = (field: keyof NonNullable<ContactState['errors']>) => state.errors?.[field];

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={locale} />

      <label className="absolute -left-[9999px]" aria-hidden="true">
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={pick(locale, 'Name', 'Nombre')} error={errorFor('name')}>
          <input
            className={fieldClass}
            type="text"
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            aria-invalid={Boolean(errorFor('name'))}
          />
        </Field>

        <Field label={pick(locale, 'Email', 'Correo electrónico')} error={errorFor('email')}>
          <input
            className={fieldClass}
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errorFor('email'))}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={pick(locale, 'Phone (optional)', 'Teléfono (opcional)')} error={errorFor('phone')}>
          <input
            className={fieldClass}
            type="tel"
            name="phone"
            maxLength={30}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(errorFor('phone'))}
          />
        </Field>

        <Field label={pick(locale, 'Subject', 'Asunto')} error={errorFor('subject')}>
          <select
            className={fieldClass}
            name="subject"
            required
            defaultValue=""
            aria-invalid={Boolean(errorFor('subject'))}
          >
            <option value="" disabled>
              {pick(locale, 'Choose one', 'Selecciona una opción')}
            </option>
            <option value="product">{pick(locale, 'Product question', 'Consulta sobre producto')}</option>
            <option value="order">{pick(locale, 'Order help', 'Ayuda con un pedido')}</option>
            <option value="shipping">{pick(locale, 'Shipping or returns', 'Envíos o devoluciones')}</option>
            <option value="other">{pick(locale, 'Other', 'Otro')}</option>
          </select>
        </Field>
      </div>

      <Field
        label={pick(locale, 'Order number (optional)', 'Número de pedido (opcional)')}
        error={errorFor('orderNumber')}
      >
        <input
          className={fieldClass}
          type="text"
          name="orderNumber"
          maxLength={40}
          autoComplete="off"
          aria-invalid={Boolean(errorFor('orderNumber'))}
        />
      </Field>

      <Field label={pick(locale, 'How can we help?', '¿Cómo podemos ayudarte?')} error={errorFor('message')}>
        <textarea
          className={`${fieldClass} min-h-36 resize-y py-3`}
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          aria-invalid={Boolean(errorFor('message'))}
        />
      </Field>

      {state.status === 'error' ? (
        <p role="alert" aria-live="polite" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending} className="sm:w-auto">
        <Send className="size-4" aria-hidden="true" />
        {pending
          ? pick(locale, 'Sending…', 'Enviando…')
          : pick(locale, 'Send message', 'Enviar mensaje')}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-body">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
