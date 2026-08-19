'use client';

import { useActionState } from 'react';
import { signUp, type RegisterState } from './actions';
import type { Locale } from '@/lib/i18n';

const initialState: RegisterState = {};

export function RegisterForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.awaitingConfirmation) {
    return (
      <div role="status" className="rounded-sm border border-line bg-white-warm p-5 text-sm text-body">
        {locale === 'es'
          ? 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.'
          : 'Account created. Check your email to confirm it before signing in.'}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={locale} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            {locale === 'es' ? 'Nombre' : 'First name'}
          </span>
          <input
            type="text"
            name="firstName"
            required
            autoComplete="given-name"
            className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            {locale === 'es' ? 'Apellido' : 'Last name'}
          </span>
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
          />
        </label>
      </div>

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
          minLength={8}
          autoComplete="new-password"
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        />
        <span className="mt-1.5 block text-xs text-muted">
          {locale === 'es' ? 'Mínimo 8 caracteres.' : 'At least 8 characters.'}
        </span>
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
            ? 'Creando cuenta…'
            : 'Creating account…'
          : locale === 'es'
            ? 'Crear cuenta'
            : 'Create account'}
      </button>
    </form>
  );
}
