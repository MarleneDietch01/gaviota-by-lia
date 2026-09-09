"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) throw new Error("Datos inválidos");

  const supabase = await createServerSupabaseClient();

  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("product_id, user_id, order_id, products:product_id(slug)")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) {
    throw new Error("No se encontró la reseña");
  }

  // Dos formas legítimas de haber comprado, y antes solo se contemplaba una:
  //   · con cuenta  -> se comprueba contra sus pedidos entregados;
  //   · sin cuenta  -> la reseña llegó por un enlace firmado, que solo se
  //     emite al entregar un pedido que contiene ese producto. `order_id` ES
  //     la prueba.
  // Sin esta segunda rama, aprobar una reseña de invitada le BORRABA la
  // insignia de compra verificada, que es justo la señal de confianza por la
  // que existe el flujo.
  let verifiedPurchase = false;
  if (review.user_id) {
    const { data: eligible } = await supabase.rpc("has_verified_purchase", {
      p_user_id: review.user_id,
      p_product_id: review.product_id,
    });
    verifiedPurchase = Boolean(eligible);
  } else if (review.order_id) {
    verifiedPurchase = true;
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      status: "approved",
      verified_purchase: verifiedPurchase,
      moderated_by: admin.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`No se pudo aprobar la reseña: ${error.message}`);
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/es");
  revalidatePath("/en");
}

export async function rejectReview(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) throw new Error("Datos inválidos");

  const supabase = await createServerSupabaseClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("products:product_id(slug)")
    .eq("id", reviewId)
    .single();

  const { error } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      moderated_by: admin.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`No se pudo rechazar la reseña: ${error.message}`);
  }

  revalidateAfterModeration(review?.products?.slug);
}

/**
 * Purga lo que muestra reseñas. La ficha del producto se revalidaba: sin ella,
 * moderar cambiaba la base pero la página seguía sirviendo el render anterior
 * — una reseña aprobada aparecía sin su insignia de compra verificada hasta
 * que algo más invalidara la ruta.
 */
function revalidateAfterModeration(slug: string | undefined): void {
  revalidatePath("/admin/reviews");
  revalidatePath("/es");
  revalidatePath("/en");
  if (slug) {
    revalidatePath(`/es/products/${slug}`);
    revalidatePath(`/en/products/${slug}`);
  }
}
