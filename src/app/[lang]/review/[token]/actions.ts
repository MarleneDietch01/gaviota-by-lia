'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyReviewToken } from '@/lib/reviews/invitation-token';
import { reviewSchema } from '@/lib/validation/reviews';
import { isLocale, type Locale } from '@/lib/i18n';

export interface GuestReviewState {
  readonly error?: string;
  readonly success?: boolean;
}

/**
 * Reseña dejada desde el enlace de invitación, sin cuenta.
 *
 * -----------------------------------------------------------------------------
 * QUÉ AUTORIZA ESTA ACCIÓN
 * -----------------------------------------------------------------------------
 * El token se vuelve a verificar AQUÍ. La página ya lo hizo para decidir qué
 * pintar, pero eso no autoriza nada: una Server Action es un endpoint HTTP
 * invocable directamente, así que el `productId` y el `orderId` se leen del
 * token firmado y NUNCA del formulario. Lo que llega del navegador es solo
 * puntuación, título y texto.
 *
 * `verified_purchase: true` se fija aquí con `service_role` porque es cierto
 * por construcción: el token solo se emite al marcar entregado un pedido que
 * contiene ese producto. RLS impide que una clienta se lo ponga sola.
 *
 * El uso único lo da `reviews_guest_order_product_idx`: la segunda reseña para
 * el mismo (pedido, producto) choca con el índice y se traduce a un mensaje.
 * -----------------------------------------------------------------------------
 */
export async function submitGuestReview(
  _prevState: GuestReviewState,
  formData: FormData,
): Promise<GuestReviewState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  const token = String(formData.get('token') ?? '');
  const verified = verifyReviewToken(token);

  if (!verified.ok) {
    return {
      error:
        verified.reason === 'expired'
          ? t('This review link has expired.', 'Este enlace para reseñar ya caducó.')
          : t('This review link is not valid.', 'Este enlace para reseñar no es válido.'),
    };
  }

  const { orderId, productId } = verified.invitation;

  // Por pedido, no por IP: quien tiene el enlace ya está identificado, y una
  // IP compartida no debe bloquear a una clienta legítima.
  const allowed = await checkRateLimit(`guest-review:${orderId}`, 10, 3600);
  if (!allowed) {
    return { error: t('Too many attempts. Try again later.', 'Demasiados intentos. Inténtalo más tarde.') };
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
      error: t('Enter a valid rating and comment.', 'Escribe una calificación y un comentario válidos.'),
    };
  }

  const admin = createAdminSupabaseClient();

  const { error } = await admin.from('reviews').insert({
    product_id: productId,
    order_id: orderId,
    user_id: null,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    content: parsed.data.content,
    verified_purchase: true,
  });

  if (error) {
    // 23505: choque con el índice único de reseñas de invitada.
    if (error.code === '23505') {
      return { error: t('You already reviewed this product.', 'Ya dejaste una reseña de este producto.') };
    }
    return { error: t('We could not save your review. Try again.', 'No pudimos guardar tu reseña. Inténtalo de nuevo.') };
  }

  return { success: true };
}
