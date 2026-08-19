import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, pick } from '@/lib/i18n';
import { ResetPasswordForm } from './reset-password-form';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Set a new password', 'Crear nueva contraseña'), robots: { index: false } };
}

export default async function ResetPasswordPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto w-full max-w-sm">
          <p className="eyebrow mb-3 text-rose">{pick(lang, 'Account', 'Cuenta')}</p>
          <h1 className="text-h1">{pick(lang, 'Set a new password', 'Crear nueva contraseña')}</h1>

          <div className="mt-8">
            <ResetPasswordForm locale={lang} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
