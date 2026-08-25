import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { cents, formatMoney } from '@/lib/commerce/money';
import { isLocale, localizedHref, pick } from '@/lib/i18n';
import { signOutCustomer } from './actions';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: pick(lang, 'Your account', 'Tu cuenta'), robots: { index: false } };
}

const STATUS_LABEL: Record<string, { en: string; es: string }> = {
  pending_payment: { en: 'Payment pending', es: 'Pago pendiente' },
  paid: { en: 'Paid', es: 'Pagado' },
  processing: { en: 'Processing', es: 'En proceso' },
  ready_to_ship: { en: 'Ready to ship', es: 'Listo para enviar' },
  shipped: { en: 'Shipped', es: 'Enviado' },
  delivered: { en: 'Delivered', es: 'Entregado' },
  cancelled: { en: 'Cancelled', es: 'Cancelado' },
  refunded: { en: 'Refunded', es: 'Reembolsado' },
  partially_refunded: { en: 'Partially refunded', es: 'Reembolso parcial' },
};

export default async function AccountPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(localizedHref(lang, '/login'));

  const supabase = await createServerSupabaseClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, grand_total, order_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <p className="eyebrow mb-3 text-rose">{pick(lang, 'Account', 'Cuenta')}</p>
        <h1 className="text-h1">
          {pick(lang, 'Hello, ', 'Hola, ')}
          {user.firstName ?? user.email}
        </h1>
        <p className="mt-4 text-lead text-body">{user.email}</p>

        {user.role === 'admin' || user.role === 'super_admin' ? (
          <Link
            href="/admin"
            className="mt-5 inline-flex min-h-11 items-center rounded-xs border border-ink/25 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
          >
            {pick(lang, 'Go to admin panel', 'Ir al panel de administración')}
          </Link>
        ) : null}

        <Rule className="my-8" />

        <h2 className="font-display text-h3">{pick(lang, 'Your orders', 'Tus pedidos')}</h2>

        {orders && orders.length > 0 ? (
          <ul className="mt-5 divide-y divide-line rounded-sm border border-line">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="tabular font-medium">{order.order_number}</span>
                <span className="text-body">
                  {STATUS_LABEL[order.order_status]?.[lang] ?? order.order_status}
                </span>
                <span className="tabular font-semibold">
                  {formatMoney(cents(order.grand_total), 'USD', lang === 'es' ? 'es-US' : 'en-US')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-body">
            {pick(lang, "You haven't placed any orders yet.", 'Todavía no tienes pedidos.')}
          </p>
        )}

        <form action={signOutCustomer} className="mt-10">
          <input type="hidden" name="lang" value={lang} />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center rounded-xs border border-ink/55 px-6 text-sm font-semibold transition-colors hover:bg-ink hover:text-white-warm"
          >
            {pick(lang, 'Sign out', 'Cerrar sesión')}
          </button>
        </form>
      </Container>
    </Section>
  );
}
