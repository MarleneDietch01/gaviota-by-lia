import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Container, Section } from '@/components/ui/layout-primitives';
import { isLocale, localizedHref, pick } from '@/lib/i18n';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ order?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Order confirmed', 'Pedido confirmado'), robots: { index: false } };
}

/**
 * El pago se confirma de verdad en `/api/webhooks/stripe`, no aquí.
 *
 * Esta página solo la ve quien vuelve del checkout de Stripe — es cortesía
 * visual, no la fuente de verdad del estado del pedido. Un navegador cerrado a
 * mitad del redirect no debe impedir que el pedido quede marcado como pagado.
 */
export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const [{ lang }, { order }] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto max-w-md text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="mt-6 text-h1">{pick(lang, 'Thank you!', '¡Gracias!')}</h1>
          <p className="mt-4 text-lead text-body">
            {pick(
              lang,
              'Your order has been received and is being confirmed.',
              'Recibimos tu pedido y lo estamos confirmando.',
            )}
          </p>
          {order ? (
            <p className="mt-4 text-sm text-muted">
              {pick(lang, 'Order number: ', 'Número de pedido: ')}
              <span className="tabular font-semibold text-ink">{order}</span>
            </p>
          ) : null}

          <Link
            href={localizedHref(lang, '/account')}
            className="mt-9 inline-flex min-h-12 items-center rounded-xs bg-rose px-7 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
          >
            {pick(lang, 'View my orders', 'Ver mis pedidos')}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
