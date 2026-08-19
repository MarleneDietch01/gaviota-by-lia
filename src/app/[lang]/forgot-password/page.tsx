import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, pick } from '@/lib/i18n';
import { ForgotPasswordForm } from './forgot-password-form';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Reset your password', 'Restablecer contraseña'), robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto w-full max-w-sm">
          <p className="eyebrow mb-3 text-rose">{pick(lang, 'Account', 'Cuenta')}</p>
          <h1 className="text-h1">{pick(lang, 'Reset your password', 'Restablecer contraseña')}</h1>
          <p className="mt-4 text-lead text-body">
            {pick(
              lang,
              "Enter your email and we'll send you a link to set a new password.",
              'Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.',
            )}
          </p>

          <div className="mt-8">
            <ForgotPasswordForm locale={lang} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
