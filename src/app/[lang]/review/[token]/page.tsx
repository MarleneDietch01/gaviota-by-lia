import type { Metadata } from 'next';
import Image from 'next/image';
import { Container, Section } from '@/components/ui/layout-primitives';
import { getProductBySlug } from '@/lib/catalog/products';
import { verifyReviewToken } from '@/lib/reviews/invitation-token';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isLocale, type Locale } from '@/lib/i18n';
import { GuestReviewForm } from './guest-review-form';

/**
 * Página de reseña por invitación.
 *
 * El enlace es privado y de un solo uso efectivo: nunca debe indexarse ni
 * aparecer en el sitemap.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ lang: string; token: string }>;
}

/** Mensaje a pantalla completa, para los casos en que no hay nada que reseñar. */
function Aviso({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <Section tone="ivory">
      <Container size="narrow">
        <h1 className="text-h2 text-ink">{titulo}</h1>
        <p className="mt-3 text-body-sm text-body">{detalle}</p>
      </Container>
    </Section>
  );
}

export default async function ReviewInvitationPage({ params }: Props) {
  const { lang: langRaw, token } = await params;
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  const verified = verifyReviewToken(token);

  if (!verified.ok) {
    return verified.reason === 'expired' ? (
      <Aviso
        titulo={t('This link has expired', 'Este enlace ya caducó')}
        detalle={t(
          'Review links are valid for 60 days after delivery. Write to us on WhatsApp and we will help.',
          'Los enlaces para reseñar valen 60 días desde la entrega. Escríbenos por WhatsApp y te ayudamos.',
        )}
      />
    ) : (
      <Aviso
        titulo={t('This link is not valid', 'Este enlace no es válido')}
        detalle={t(
          'Check that you copied the whole link from the email.',
          'Comprueba que copiaste el enlace completo del correo.',
        )}
      />
    );
  }

  const { orderId, productId } = verified.invitation;

  // `service_role`: leer una reseña de un pedido ajeno no está permitido por
  // RLS para quien no tiene sesión, y aquí quien llega no la tiene por diseño.
  // La autorización la dio el token, ya verificado arriba.
  const admin = createAdminSupabaseClient();

  const [{ data: productRow }, { data: existing }] = await Promise.all([
    admin.from('products').select('slug').eq('id', productId).maybeSingle(),
    admin
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('order_id', orderId)
      .is('user_id', null)
      .maybeSingle(),
  ]);

  if (!productRow?.slug) {
    return (
      <Aviso
        titulo={t('Product not available', 'Producto no disponible')}
        detalle={t(
          'This product is no longer in the catalogue.',
          'Este producto ya no está en el catálogo.',
        )}
      />
    );
  }

  if (existing) {
    return (
      <Aviso
        titulo={t('You already reviewed this', 'Ya reseñaste este producto')}
        detalle={t(
          'Thank you — we only accept one review per product and order.',
          'Gracias: solo aceptamos una reseña por producto y pedido.',
        )}
      />
    );
  }

  const product = await getProductBySlug(productRow.slug, lang);

  if (!product) {
    return (
      <Aviso
        titulo={t('Product not available', 'Producto no disponible')}
        detalle={t(
          'This product is no longer in the catalogue.',
          'Este producto ya no está en el catálogo.',
        )}
      />
    );
  }

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <p className="eyebrow text-gold-deep">{t('Verified purchase', 'Compra verificada')}</p>
        <h1 className="mt-3 text-h2 text-ink">
          {t('How was it?', '¿Qué tal te fue?')}
        </h1>

        <div className="mt-6 flex items-center gap-4 rounded-sm border border-line bg-white-warm p-4">
          {product.image ? (
            <Image
              src={product.image}
              alt=""
              width={72}
              height={72}
              className="size-18 shrink-0 rounded-xs object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{product.name}</p>
            <p className="mt-0.5 text-caption text-body">
              {t('From your delivered order', 'De tu pedido entregado')}
            </p>
          </div>
        </div>

        <p className="mt-6 text-body-sm text-body">
          {t(
            'No account needed. We read every review before publishing it, and we never edit your words.',
            'No necesitas cuenta. Leemos cada reseña antes de publicarla, y nunca editamos tus palabras.',
          )}
        </p>

        <div className="mt-6">
          <GuestReviewForm token={token} locale={lang} />
        </div>
      </Container>
    </Section>
  );
}
