'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Aprueba una reseña.
 *
 * `verified_purchase` se recalcula aquí, no se confía en lo que el formulario
 * de la clienta pudiera haber mandado (que de todos modos RLS ya rechaza):
 * solo `reviews_admin_all` puede fijar ese campo, así que es la moderación
 * quien decide el sello "compra verificada" en el momento de publicar.
 */
export async function approveReview(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const reviewId = String(formData.get('reviewId') ?? '');
  if (!reviewId) throw new Error('Datos inválidos');

  const supabase = await createServerSupabaseClient();

  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('product_id, user_id')
    .eq('id', reviewId)
    .single();

  if (fetchError || !review) {
    throw new Error('No se encontró la reseña');
  }

  let verifiedPurchase = false;
  if (review.user_id) {
    const { data: eligible } = await supabase.rpc('has_verified_purchase', {
      p_user_id: review.user_id,
      p_product_id: review.product_id,
    });
    verifiedPurchase = Boolean(eligible);
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      status: 'approved',
      verified_purchase: verifiedPurchase,
      moderated_by: admin.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`No se pudo aprobar la reseña: ${error.message}`);
  }

  revalidatePath('/admin/reviews');
}

export async function rejectReview(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const reviewId = String(formData.get('reviewId') ?? '');
  if (!reviewId) throw new Error('Datos inválidos');

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('reviews')
    .update({
      status: 'rejected',
      moderated_by: admin.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`No se pudo rechazar la reseña: ${error.message}`);
  }

  revalidatePath('/admin/reviews');
}
