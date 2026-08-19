'use client';

import { useActionState } from 'react';
import { signIn, type AuthFormState } from './actions';
import type { Locale } from '@/lib/i18n';

const initialState: AuthFormState = {};

export function LoginForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

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

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Contraseña' : 'Password'}
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
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
        {pending ? (locale === 'es' ? 'Entrando…' : 'Signing in…') : locale === 'es' ? 'Entrar' : 'Sign in'}
      </button>
    </form>
  );
}
