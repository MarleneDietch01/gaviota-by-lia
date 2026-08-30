import { createServerSupabaseClient } from '@/lib/supabase/server';
import { approveReview, rejectReview } from './actions';

export const metadata = { title: 'Reseñas' };

export default async function AdminReviewsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, rating, title, content, created_at, profiles:user_id(email), products:product_id(name, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-h2">Reseñas</h1>
      <p className="mt-1 text-sm text-body">Pendientes de moderación, las más antiguas primero.</p>

      {error ? (
        <p className="mt-8 text-sm text-danger">No se pudieron cargar las reseñas: {error.message}</p>
      ) : reviews && reviews.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-sm border border-line bg-white-warm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {review.products?.name ?? review.products?.slug ?? 'Producto'}
                  </p>
                  <p className="text-xs text-muted">{review.profiles?.email ?? 'Cliente sin correo'}</p>
                </div>
                <span className="rounded-pill bg-powder/40 px-2.5 py-1 text-xs font-semibold text-rose-deep">
                  {review.rating} / 5
                </span>
              </div>

              {review.title ? <p className="mt-3 font-medium text-ink">{review.title}</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-body">{review.content}</p>

              <div className="mt-4 flex gap-3">
                <form action={approveReview}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button
                    type="submit"
                    className="min-h-10 rounded-xs bg-rose px-5 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
                  >
                    Aprobar
                  </button>
                </form>
                <form action={rejectReview}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button
                    type="submit"
                    className="min-h-10 rounded-xs border border-ink/25 px-5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
                  >
                    Rechazar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-body">No hay reseñas pendientes.</p>
      )}
    </div>
  );
}
