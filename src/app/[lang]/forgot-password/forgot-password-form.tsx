'use client';

import { useActionState } from 'react';
import { requestPasswordReset, type ForgotPasswordState } from './actions';
import type { Locale } from '@/lib/i18n';

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div role="status" className="rounded-sm border border-line bg-white-warm p-5 text-sm text-body">
        {locale === 'es'
          ? 'Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.'
          : "If that email has an account, we've sent a link to reset the password."}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={locale} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Correo' : 'Email'}
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
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
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xs bg-rose text-sm font-semibold text-white-warm transition-colors duration-300 hover:bg-rose-deep disabled:pointer-events-none disabled:opacity-60"
      >
        {pending
          ? locale === 'es'
            ? 'Enviando…'
            : 'Sending…'
          : locale === 'es'
            ? 'Enviar enlace'
            : 'Send reset link'}
      </button>
    </form>
  );
}
