'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth/guards';
import { fromUnits } from '@/lib/commerce/money';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  findMedicalClaims,
  productEditSchema,
  stockAdjustSchema,
} from '@/lib/validation/admin-products';

/**
 * Server Actions de `/admin/products`.
 *
 * Todas empiezan con `requireAdmin()`, igual que el resto del panel — una
 * Server Action es un endpoint invocable directamente, así que protegerlo solo
 * en el layout dejaría estas rutas abiertas a quien conociera su id de acción.
 * Ninguna escribe con `service_role`: usan `createServerSupabaseClient()`
 * (RLS respetada), y son las políticas `products_admin_all` /
 * `product_variants_admin_all` / `product_images_admin_all` (que llaman a
 * `is_admin()`) las que autorizan de verdad en el motor — esta comprobación en
 * la aplicación es la primera barrera, no la única.
 */

export interface ActionResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly warning?: string;
}

/** Categorías activas, para el <select> del formulario. */
export async function listCategories() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = {
    name: formData.get('name'),
    nameEn: formData.get('nameEn'),
    shortDescription: formData.get('shortDescription') || undefined,
    description: formData.get('description') || undefined,
    shortDescriptionEn: formData.get('shortDescriptionEn') || undefined,
    descriptionEn: formData.get('descriptionEn') || undefined,
    sizeLabel: formData.get('sizeLabel') || undefined,
    sizeLabelEn: formData.get('sizeLabelEn') || undefined,
    price: formData.get('price'),
    compareAtPrice: formData.get('compareAtPrice') || undefined,
    compareAtStartsAt: formData.get('compareAtStartsAt') || undefined,
    compareAtEndsAt: formData.get('compareAtEndsAt') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    featured: formData.get('featured') === 'on',
    ingredientsText: formData.get('ingredientsText') || undefined,
    usageInstructions: formData.get('usageInstructions') || undefined,
    precautions: formData.get('precautions') || undefined,
    usageInstructionsEn: formData.get('usageInstructionsEn') || undefined,
    precautionsEn: formData.get('precautionsEn') || undefined,
    lowStockThreshold: formData.get('lowStockThreshold'),
  };

  const parsed = productEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const data = parsed.data;

  // Aviso de claims médicos: no bloquea el guardado (es texto libre de la
  // dueña, y podría ser un falso positivo — "elimina la sequedad" es
  // cosmético), pero el aviso queda registrado en el resultado de la acción
  // para que el formulario lo muestre antes de que el cambio se dé por hecho.
  const claimSources = [data.shortDescription, data.description, data.usageInstructions].filter(
    (v): v is string => Boolean(v),
  );
  const claims = claimSources.flatMap((text) => findMedicalClaims(text));
  const warning = claims.length > 0
    ? `Revisa este texto: contiene lenguaje que puede leerse como afirmación médica ("${claims.join('", "')}"). Los cosméticos no pueden usar claims de medicamento.`
    : undefined;

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      name_en: data.nameEn,
      short_description: data.shortDescription ?? null,
      description: data.description ?? null,
      short_description_en: data.shortDescriptionEn ?? null,
      description_en: data.descriptionEn ?? null,
      size_label: data.sizeLabel ?? null,
      size_label_en: data.sizeLabelEn ?? null,
      base_price: fromUnits(data.price),
      compare_at_price: data.compareAtPrice ? fromUnits(data.compareAtPrice) : null,
      compare_at_starts_at: data.compareAtStartsAt ? new Date(data.compareAtStartsAt).toISOString() : null,
      compare_at_ends_at: data.compareAtEndsAt ? new Date(data.compareAtEndsAt).toISOString() : null,
      category_id: data.categoryId ?? null,
      featured: data.featured ?? false,
      ingredients_text: data.ingredientsText ?? null,
      usage_instructions: data.usageInstructions ?? null,
      precautions: data.precautions ?? null,
      usage_instructions_en: data.usageInstructionsEn ?? null,
      precautions_en: data.precautionsEn ?? null,
      // Este formulario edita el español y el inglés a la vez (los campos
      // `*_en` de arriba), así que al guardar las dos versiones quedan
      // sincronizadas por definición y la traducción deja de estar
      // desactualizada. El mapa fijo `ENGLISH` de `lib/catalog/products.ts`
      // es solo el respaldo para los productos que aún no tienen `*_en` en
      // esta tabla.
      translation_stale: false,
    })
    .eq('id', productId);

  if (error) {
    // El error más probable aquí es una de las constraints de "precio
    // tachado" (`compare_at_needs_dates`, `compare_at_dates_ordered`,
    // `compare_at_price_higher`) si algo se coló por el zod de arriba — se
    // traduce a un mensaje legible en vez de mostrar el texto crudo de Postgres.
    const friendly = error.message.includes('compare_at')
      ? 'El precio anterior no es válido: revisa que sea mayor que el precio actual y que tenga fechas de vigencia coherentes.'
      : `No se pudo guardar: ${error.message}`;
    return { ok: false, error: friendly };
  }

  const { error: thresholdError } = await supabase
    .from('product_variants')
    .update({ low_stock_threshold: data.lowStockThreshold })
    .eq('product_id', productId);
  if (thresholdError) return { ok: false, error: `El producto se guardó, pero no el stock mínimo: ${thresholdError.message}` };

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, ...(warning ? { warning } : {}) };
}

export async function setProductStatus(productId: string, status: 'active' | 'draft'): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('products').update({ status }).eq('id', productId);
  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidatePath('/admin/products');
}

export async function createProduct(formData: FormData): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const nameEn = String(formData.get('nameEn') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const price = Number(formData.get('price'));
  const sizeLabel = String(formData.get('sizeLabel') ?? '').trim();
  if (!name || !nameEn || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Completa nombres, slug válido y precio mayor que cero.' };
  }
  const supabase = await createServerSupabaseClient();
  const { data: product, error } = await supabase.from('products').insert({
    name, name_en: nameEn, slug, base_price: fromUnits(price), size_label: sizeLabel || null,
    size_label_en: sizeLabel || null, status: 'draft', translation_stale: false,
  }).select('id').single();
  if (error || !product) return { ok: false, error: `No se pudo crear: ${error?.message ?? 'error desconocido'}` };
  const { error: variantError } = await supabase.from('product_variants').insert({
    product_id: product.id, name: sizeLabel || 'Presentación única', price: fromUnits(price), status: 'active',
  });
  if (variantError) return { ok: false, error: `Producto creado, pero falta su presentación: ${variantError.message}`, id: product.id };
  revalidatePath('/admin/products');
  return { ok: true, id: product.id };
}

/**
 * Confirma a mano que el override en inglés (`ENGLISH`, en
 * `lib/catalog/products.ts`) ya se actualizó y desplegó para reflejar el
 * español actual. No hay forma de que esto se apague solo: el texto en
 * inglés vive en código, no en esta fila, así que solo una persona puede
 * confirmar que ambos ya dicen lo mismo.
 */
export async function markTranslationReviewed(productId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('products')
    .update({ translation_stale: false })
    .eq('id', productId);
  if (error) throw new Error(`No se pudo marcar la traducción como al día: ${error.message}`);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
}

/**
 * Ajusta el stock de la variante principal. Pasa por `adjust_inventory()`,
 * NUNCA por un UPDATE directo a `product_variants.stock_quantity` — esa
 * función es la única vía autorizada en el esquema (ver
 * `supabase/migrations/20260803120014_functions.sql`) y es la que deja el
 * asiento en `inventory_movements`. Sin ella el ajuste desaparecería sin
 * dejar rastro auditable.
 */
export async function adjustStock(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = stockAdjustSchema.safeParse({
    variantId: formData.get('variantId'),
    newQuantity: formData.get('newQuantity'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('adjust_inventory', {
    p_variant_id: parsed.data.variantId,
    p_new_quantity: parsed.data.newQuantity,
    p_reason: parsed.data.reason,
    p_movement_type: 'adjustment',
  });

  if (error) {
    return { ok: false, error: `No se pudo ajustar el inventario: ${error.message}` };
  }

  revalidatePath('/admin/products');
  return { ok: true };
}

const IMAGE_BUCKET = 'products';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Sube una imagen y la marca como principal del producto.
 *
 * `altText` es obligatorio en el formulario (la propia restricción
 * `alt_text` de `product_images` ya lo exige, `not null check
 * length(trim(alt_text)) > 0` — este chequeo en la aplicación solo da un
 * mensaje legible antes de llegar a Postgres).
 */
export async function uploadProductImage(productId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get('image');
  const altText = String(formData.get('altText') ?? '').trim();
  const locale = String(formData.get('locale') ?? 'all');
  const imageRole = String(formData.get('imageRole') ?? 'gallery');
  if (!['all', 'es', 'en'].includes(locale) || !['main', 'hover', 'gallery'].includes(imageRole)) {
    return { ok: false, error: 'Tipo o idioma de imagen inválido' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Selecciona una imagen' };
  }
  if (!altText) {
    return { ok: false, error: 'El texto alternativo es obligatorio: describe lo que se ve en la foto' };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: 'Formato no permitido. Usa JPEG, PNG, WebP o AVIF.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'La imagen pesa más de 10 MB. Comprímela antes de subirla.' };
  }

  const dimensions = await readImageDimensions(file);
  if (!dimensions) {
    return { ok: false, error: 'No se pudo leer la imagen. Prueba con otro archivo.' };
  }

  const supabase = await createServerSupabaseClient();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${productId}/${locale}/${imageRole}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: `No se pudo subir la imagen: ${uploadError.message}` };
  }

  const payload = {
    product_id: productId,
    storage_path: path,
    alt_text: altText,
    width: dimensions.width,
    height: dimensions.height,
    is_primary: imageRole === 'main' && locale === 'all',
    locale,
    image_role: imageRole,
  };
  const { data: replaced } = imageRole === 'gallery' ? { data: null } : await supabase.from('product_images')
    .select('id, storage_path').eq('product_id', productId).eq('locale', locale).eq('image_role', imageRole).maybeSingle();
  const mutation = replaced
    ? await supabase.from('product_images').update(payload).eq('id', replaced.id)
    : await supabase.from('product_images').insert(payload);
  const insertError = mutation.error;

  if (insertError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    return { ok: false, error: `No se pudo registrar la imagen: ${insertError.message}` };
  }
  if (replaced) await supabase.storage.from(IMAGE_BUCKET).remove([replaced.storage_path]);

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

/** Lee ancho/alto reales del archivo subido — la base de datos los exige
 * (`width > 0`, `height > 0`) y no se inventan. */
async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
    return metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : null;
  } catch {
    return null;
  }
}

export async function deleteProductImage(productId: string, storagePath: string): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data: image } = await supabase.from('product_images').select('id, storage_path')
    .eq('product_id', productId).eq('storage_path', storagePath).maybeSingle();
  if (!image) throw new Error('La imagen no pertenece a este producto.');
  await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
  await supabase.from('product_images').delete().eq('id', image.id).eq('product_id', productId);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
}

export async function redirectToProduct(productId: string): Promise<never> {
  redirect(`/admin/products/${productId}`);
}
