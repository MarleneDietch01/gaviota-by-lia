import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ReviewSummary {
  readonly averageRating: number;
  readonly reviewCount: number;
}

/**
 * Resumen de reseñas de varios productos a la vez, para una rejilla —
 * `product_review_stats` es la misma vista que ya usa `ProductReviews` en la
 * ficha de producto (ya filtrada a `status = 'approved'` a nivel de vista, así
 * que sigue siendo legible para un visitante anónimo). Una sola consulta por
 * rejilla en vez de N+1 por tarjeta.
 */
export async function getReviewSummaries(productIds: readonly string[]): Promise<Map<string, ReviewSummary>> {
  if (productIds.length === 0) return new Map();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('product_review_stats')
    .select('product_id, average_rating, review_count')
    .in('product_id', productIds);

  const map = new Map<string, ReviewSummary>();
  for (const row of data ?? []) {
    if (!row.product_id) continue;
    map.set(row.product_id, {
      averageRating: row.average_rating ?? 0,
      reviewCount: row.review_count ?? 0,
    });
  }
  return map;
}
