import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Container, Section } from '@/components/ui/layout-primitives';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isLocale, type Locale } from '@/lib/i18n';

/**
 * Baja de las novedades, desde el enlace de cada correo comercial.
 *
 * Abrir el enlace NO da de baja: hace falta pulsar el botón. Los filtros de
 * correo corporativos y algunos antivirus abren todos los enlaces de un correo
 * para analizarlos, y una baja por GET sacaría de la lista a gente que nunca lo
 * pidió.
 *
 * El token es `newsletter_subscribers.unsubscribe_token` (24 bytes aleatorios).
 * La página responde igual para un token inexistente que para uno válido ya
 * dado de baja, para no servir de oráculo.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ lang: string; token: string }>;
  searchParams: Promise<{ done?: string }>;
}

const TOKEN_SHAPE = /^[0-9a-f]{48}$/;

async function unsubscribe(formData: FormData) {
  'use server';
  const token = String(formData.get('token') ?? '');
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';
  if (!TOKEN_SHAPE.test(token)) redirect(`/${lang}`);
  await createAdminSupabaseClient()
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('status', 'subscribed');
  redirect(`/${lang}/unsubscribe/${token}?done=1`);
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { lang: langRaw, token } = await params;
  const { done } = await searchParams;
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  let subscribed = false;
  if (TOKEN_SHAPE.test(token)) {
    const { data } = await createAdminSupabaseClient()
      .from('newsletter_subscribers')
      .select('status')
      .eq('unsubscribe_token', token)
      .maybeSingle();
    subscribed = data?.status === 'subscribed';
  }

  return (
    <Section tone="ivory">
      <Container size="narrow">
        {subscribed && !done ? (
          <>
            <h1 className="text-h2 text-ink">{t('Unsubscribe from our news', 'Darte de baja de las novedades')}</h1>
            <p className="mt-3 text-body-sm text-body">
              {t(
                'You will stop receiving our news emails. Order emails are not affected.',
                'Dejarás de recibir nuestros correos de novedades. Los correos de tus pedidos no cambian.',
              )}
            </p>
            <form action={unsubscribe} className="mt-7">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="lang" value={lang} />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center rounded-xs bg-espresso px-7 text-sm font-semibold tracking-[0.02em] text-on-dark transition-colors hover:bg-espresso-deep"
              >
                {t('Unsubscribe', 'Darme de baja')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-h2 text-ink">{t('You are not on our list', 'No estás en nuestra lista')}</h1>
            <p className="mt-3 text-body-sm text-body">
              {t(
                'You will not receive news emails from us. If you change your mind, you can subscribe again on our home page.',
                'No recibirás correos de novedades. Si cambias de idea, puedes volver a suscribirte desde la portada.',
              )}
            </p>
          </>
        )}
      </Container>
    </Section>
  );
}
