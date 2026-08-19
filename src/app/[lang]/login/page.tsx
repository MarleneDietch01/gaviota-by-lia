import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/guards';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, localizedHref, pick } from '@/lib/i18n';
import { LoginForm } from './login-form';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Sign in', 'Iniciar sesión'), robots: { index: false } };
}

export default async function LoginPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(localizedHref(lang, '/account'));

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto w-full max-w-sm">
          <p className="eyebrow mb-3 text-rose">{pick(lang, 'Account', 'Cuenta')}</p>
          <h1 className="text-h1">{pick(lang, 'Sign in', 'Iniciar sesión')}</h1>
          <p className="mt-4 text-lead text-body">
            {pick(
              lang,
              'Sign in to see your orders and manage your ritual.',
              'Inicia sesión para ver tus pedidos y gestionar tu ritual.',
            )}
          </p>

          <div className="mt-8">
            <LoginForm locale={lang} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link
              href={localizedHref(lang, '/forgot-password')}
              className="font-semibold text-rose underline decoration-rose/35 underline-offset-4 hover:text-rose-deep"
            >
              {pick(lang, 'Forgot your password?', '¿Olvidaste tu contraseña?')}
            </Link>
            <Link
              href={localizedHref(lang, '/register')}
              className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:text-rose"
            >
              {pick(lang, 'Create an account', 'Crear una cuenta')}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
