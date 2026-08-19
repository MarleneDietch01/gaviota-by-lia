import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, localizedHref, pick } from '@/lib/i18n';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Checkout cancelled', 'Compra cancelada'), robots: { index: false } };
}

export default async function CheckoutCancelPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-h1">{pick(lang, 'Checkout cancelled', 'Compra cancelada')}</h1>
          <p className="mt-4 text-lead text-body">
            {pick(
              lang,
              'No charge was made. Your bag is still here whenever you want to continue.',
              'No se realizó ningún cobro. Tu bolsa sigue aquí para cuando quieras continuar.',
            )}
          </p>

          <Link
            href={localizedHref(lang, '/cart')}
            className="mt-9 inline-flex min-h-12 items-center rounded-xs bg-rose px-7 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
          >
            {pick(lang, 'Back to bag', 'Volver a la bolsa')}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
