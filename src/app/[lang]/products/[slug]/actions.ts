'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/guards';
import { getProductIdBySlug } from '@/lib/catalog/product-ids';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validation/reviews';
import { isLocale, type Locale } from '@/lib/i18n';

export interface ReviewFormState {
  readonly error?: string;
  readonly success?: boolean;
}

/**
 * Envía una reseña de un producto.
 *
 * `has_verified_purchase` es la misma comprobación que ya usa el sistema de
 * favoritos/reseñas en la base de datos (`SECURITY DEFINER`, ver
 * `20260803120014_functions.sql`): la reseña se rechaza aquí, antes de
 * intentar el insert, si la clienta no tiene un pedido `delivered` con este
 * producto — evita depender solo de un mensaje de error genérico de RLS.
 *
 * El insert nunca manda `verified_purchase: true` ni `status: 'approved'`:
 * las políticas RLS (`reviews_insert_own`) lo rechazarían igual, porque solo
 * `reviews_admin_all` puede fijar esos campos. Toda reseña nueva entra
 * `pending` y se modera en `/admin/reviews`.
 */
export async function submitReview(_prevState: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'en';
  const slug = String(formData.get('slug') ?? '');

  const user = await requireUser().catch(() => null);
  if (!user) {
    return {
      error: lang === 'es' ? 'Inicia sesión para dejar una reseña.' : 'Sign in to leave a review.',
    };
  }

  const productId = await getProductIdBySlug(slug);
  if (!productId) {
    return { error: lang === 'es' ? 'Producto no encontrado.' : 'Product not found.' };
  }

  const parsed = reviewSchema.safeParse({
    productId,
    rating: formData.get('rating'),
    title: formData.get('title'),
    content: formData.get('content'),
    lang,
  });

  if (!parsed.success) {
    return {
      error:
        lang === 'es'
          ? 'Completa una calificación y un comentario válidos.'
          : 'Enter a valid rating and comment.',
    };
  }

  const allowed = await checkRateLimit(`review:${user.id}`, 5, 3600);
  if (!allowed) {
    return {
      error:
        lang === 'es'
          ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
          : 'Too many attempts. Wait a few minutes and try again.',
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data: eligible } = await supabase.rpc('has_verified_purchase', {
    p_user_id: user.id,
    p_product_id: productId,
  });

  if (!eligible) {
    return {
      error:
        lang === 'es'
          ? 'Solo puedes reseñar productos de un pedido entregado.'
          : 'You can only review products from a delivered order.',
    };
  }

  const { error } = await supabase.from('reviews').insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    content: parsed.data.content,
  });

  if (error) {
    // Choca con la restricción única (product_id, user_id): ya existe una
    // reseña de esta clienta para este producto.
    return {
      error:
        lang === 'es'
          ? 'Ya dejaste una reseña para este producto.'
          : 'You already reviewed this product.',
    };
  }

  revalidatePath(`/${lang}/products/${slug}`);
  return { success: true };
}
