import { getCurrentUser } from '@/lib/auth/guards';
import { getProductIdBySlug } from '@/lib/catalog/product-ids';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n';
import { Stars } from '@/components/ui/stars';
import { ReviewForm } from './review-form';

/**
 * Sección de reseñas de la ficha de producto.
 *
 * Se apoya en `product_review_stats` (vista ya filtrada a `status =
 * 'approved'`, ver `20260803120011_favorites_reviews.sql`) para el promedio y
 * el conteo, y en una consulta aparte a `reviews` para el listado — ambas
 * sujetas a RLS, así que solo pueden devolver reseñas aprobadas para
 * cualquier visitante anónimo.
 *
 * El formulario de envío solo se muestra si hay sesión, la persona tiene un
 * pedido `delivered` con este producto, y todavía no dejó una reseña — las
 * tres condiciones se resuelven aquí en servidor, no en el cliente, porque
 * son la misma comprobación que ya hace la Server Action al insertar.
 */
export async function ProductReviews({ slug, locale }: { slug: string; locale: Locale }) {
  const productId = await getProductIdBySlug(slug);
  if (!productId) return null;

  const supabase = await createServerSupabaseClient();

  const [{ data: stats }, { data: reviews }, user] = await Promise.all([
    supabase.from('product_review_stats').select('average_rating, review_count').eq('product_id', productId).maybeSingle(),
    supabase
      .from('reviews')
      .select('id, rating, title, content, verified_purchase, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20),
    getCurrentUser(),
  ]);

  let showForm = false;
  if (user) {
    const [{ data: eligible }, { data: own }] = await Promise.all([
      supabase.rpc('has_verified_purchase', { p_user_id: user.id, p_product_id: productId }),
      supabase.from('reviews').select('id').eq('product_id', productId).eq('user_id', user.id).maybeSingle(),
    ]);
    showForm = Boolean(eligible) && !own;
  }

  const reviewCount = stats?.review_count ?? 0;
  const averageRating = stats?.average_rating ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-h2">{locale === 'es' ? 'Reseñas' : 'Reviews'}</h2>
        {reviewCount > 0 ? (
          <p className="flex items-center gap-2 text-sm text-body">
            <Stars rating={Math.round(averageRating)} />
            <span>
              {averageRating.toFixed(1)} ·{' '}
              {locale === 'es'
                ? `${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'}`
                : `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
            </span>
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-6">
        {reviews && reviews.length > 0 ? (
          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-line pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Stars rating={review.rating} />
                  {review.verified_purchase ? (
                    <span className="rounded-pill bg-success/15 px-2 py-0.5 text-caption font-semibold uppercase tracking-wide text-success">
                      {locale === 'es' ? 'Compra verificada' : 'Verified purchase'}
                    </span>
                  ) : null}
                </div>
                {review.title ? <p className="mt-2.5 font-semibold text-ink">{review.title}</p> : null}
                <p className="mt-2 text-body-sm leading-relaxed text-body">{review.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-body">
            {locale === 'es'
              ? 'Todavía no hay reseñas para este producto.'
              : 'There are no reviews for this product yet.'}
          </p>
        )}

        {showForm ? <ReviewForm slug={slug} locale={locale} /> : null}
      </div>
    </div>
  );
}
