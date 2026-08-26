'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
    shortDescription: formData.get('shortDescription') || undefined,
    description: formData.get('description') || undefined,
    sizeLabel: formData.get('sizeLabel') || undefined,
    price: formData.get('price'),
    compareAtPrice: formData.get('compareAtPrice') || undefined,
    compareAtStartsAt: formData.get('compareAtStartsAt') || undefined,
    compareAtEndsAt: formData.get('compareAtEndsAt') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    featured: formData.get('featured') === 'on',
    ingredientsText: formData.get('ingredientsText') || undefined,
    usageInstructions: formData.get('usageInstructions') || undefined,
    precautions: formData.get('precautions') || undefined,
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
      short_description: data.shortDescription ?? null,
      description: data.description ?? null,
      size_label: data.sizeLabel ?? null,
      base_price: fromUnits(data.price),
      compare_at_price: data.compareAtPrice ? fromUnits(data.compareAtPrice) : null,
      compare_at_starts_at: data.compareAtStartsAt ? new Date(data.compareAtStartsAt).toISOString() : null,
      compare_at_ends_at: data.compareAtEndsAt ? new Date(data.compareAtEndsAt).toISOString() : null,
      category_id: data.categoryId ?? null,
      featured: data.featured ?? false,
      ingredients_text: data.ingredientsText ?? null,
      usage_instructions: data.usageInstructions ?? null,
      precautions: data.precautions ?? null,
      // El inglés que ve la clienta viene de un mapa fijo en código (ver
      // `ENGLISH` en `lib/catalog/products.ts`), no de esta tabla — así que
      // cualquier guardado de estos campos en español deja esa traducción
      // desactualizada EN SILENCIO si nadie lo marca. Se enciende siempre,
      // sin comparar campo por campo: es más seguro avisar de más que dejar
      // pasar una edición real por un diff mal hecho.
      translation_stale: true,
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
  const path = `${productId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: `No se pudo subir la imagen: ${uploadError.message}` };
  }

  // Solo una imagen "principal" por producto (índice único parcial en la
  // base de datos, `product_images_one_primary`): se desmarca la anterior
  // antes de insertar la nueva para no chocar con esa restricción.
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);

  const { error: insertError } = await supabase.from('product_images').insert({
    product_id: productId,
    storage_path: path,
    alt_text: altText,
    width: dimensions.width,
    height: dimensions.height,
    is_primary: true,
  });

  if (insertError) {
    return { ok: false, error: `No se pudo registrar la imagen: ${insertError.message}` };
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

/** Lee ancho/alto reales del archivo subido — la base de datos los exige
 * (`width > 0`, `height > 0`) y no se inventan. */
async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return probeImageSize(buffer);
  } catch {
    return null;
  }
}

/** Lector mínimo de cabeceras PNG/JPEG/WebP, sin dependencias nuevas. */
function probeImageSize(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG: firma de 8 bytes, luego el chunk IHDR con ancho/alto en big-endian.
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
    const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
    return { width, height };
  }

  // JPEG: recorre los marcadores SOFx.
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 9) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1]!;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
        const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
        return { width, height };
      }
      const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
      offset += 2 + length;
    }
    return null;
  }

  // WebP (VP8 lossy): cabecera RIFF....WEBPVP8 seguida de dimensiones.
  if (bytes.length > 30 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    const width = ((bytes[27]! | (bytes[28]! << 8)) & 0x3fff);
    const height = ((bytes[29]! | (bytes[30]! << 8)) & 0x3fff);
    if (width > 0 && height > 0) return { width, height };
  }

  return null;
}

export async function deleteProductImage(productId: string, storagePath: string): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
  await supabase.from('product_images').delete().eq('product_id', productId).eq('storage_path', storagePath);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
}

export async function redirectToProduct(productId: string): Promise<never> {
  redirect(`/admin/products/${productId}`);
}
