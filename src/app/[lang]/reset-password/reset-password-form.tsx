'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { localizedHref, type Locale } from '@/lib/i18n';

type Status = 'checking' | 'ready' | 'invalid' | 'saving' | 'done';

/**
 * El enlace del correo de recuperación deja una sesión temporal en el
 * navegador (evento `PASSWORD_RECOVERY` de Supabase) — por eso este formulario
 * es cliente y no un Server Action: la sesión vive en el cliente hasta que se
 * confirma la contraseña nueva con `updateUser`.
 */
export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    // Si el evento ya se disparó antes de montar el listener, la sesión de
    // recuperación sigue presente en `getSession()`.
    supabase.auth.getSession().then(({ data }) => {
      setStatus((current) => (current === 'checking' ? (data.session ? 'ready' : 'invalid') : current));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse({
      password: new FormData(event.currentTarget).get('password'),
    });

    if (!parsed.success) {
      setError(
        locale === 'es' ? 'La contraseña debe tener al menos 8 caracteres.' : 'Password must be at least 8 characters.',
      );
      return;
    }

    setStatus('saving');
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (updateError) {
      setError(locale === 'es' ? 'No se pudo actualizar la contraseña.' : 'Could not update the password.');
      setStatus('ready');
      return;
    }

    setStatus('done');
    setTimeout(() => router.push(localizedHref(locale, '/account')), 1500);
  }

  if (status === 'checking') {
    return <p className="text-sm text-body">{locale === 'es' ? 'Comprobando enlace…' : 'Checking link…'}</p>;
  }

  if (status === 'invalid') {
    return (
      <p role="alert" className="text-sm text-danger">
        {locale === 'es'
          ? 'Este enlace no es válido o ya expiró. Solicita uno nuevo.'
          : 'This link is invalid or has expired. Request a new one.'}
      </p>
    );
  }

  if (status === 'done') {
    return (
      <p role="status" className="text-sm text-success">
        {locale === 'es' ? 'Contraseña actualizada. Entrando…' : 'Password updated. Signing you in…'}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {locale === 'es' ? 'Contraseña nueva' : 'New password'}
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-4 text-sm"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xs bg-rose text-sm font-semibold text-white-warm transition-colors duration-300 hover:bg-rose-deep disabled:pointer-events-none disabled:opacity-60"
      >
        {status === 'saving'
          ? locale === 'es'
            ? 'Guardando…'
            : 'Saving…'
          : locale === 'es'
            ? 'Guardar contraseña'
            : 'Save password'}
      </button>
    </form>
  );
}
