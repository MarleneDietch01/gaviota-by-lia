import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/guards';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, localizedHref, pick } from '@/lib/i18n';
import { RegisterForm } from './register-form';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Create an account', 'Crear una cuenta'), robots: { index: false } };
}

export default async function RegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const user = await getCurrentUser();
  if (user) redirect(localizedHref(lang, '/account'));

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto w-full max-w-sm">
          <p className="eyebrow mb-3 text-rose">{pick(lang, 'Account', 'Cuenta')}</p>
          <h1 className="text-h1">{pick(lang, 'Create an account', 'Crear una cuenta')}</h1>
          <p className="mt-4 text-lead text-body">
            {pick(
              lang,
              'Save your details for a faster checkout and keep track of your orders.',
              'Guarda tus datos para un pago más rápido y da seguimiento a tus pedidos.',
            )}
          </p>

          <div className="mt-8">
            <RegisterForm locale={lang} />
          </div>

          <p className="mt-6 text-sm">
            {pick(lang, 'Already have an account? ', '¿Ya tienes una cuenta? ')}
            <Link
              href={localizedHref(lang, '/login')}
              className="font-semibold text-rose underline decoration-rose/35 underline-offset-4 hover:text-rose-deep"
            >
              {pick(lang, 'Sign in', 'Inicia sesión')}
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
