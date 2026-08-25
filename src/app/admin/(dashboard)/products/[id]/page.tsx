import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, toUnits } from '@/lib/commerce/money';
import { adjustStock, deleteProductImage, listCategories, updateProduct, uploadProductImage } from '../actions';

export const metadata = { title: 'Editar producto' };

const IMAGE_BUCKET = 'products';

function imageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

type FeedbackParams = { error?: string; warning?: string; saved?: string };

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FeedbackParams>;
}) {
  const { id } = await params;
  const { error: errorParam, warning: warningParam, saved } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const [{ data: product, error }, categories] = await Promise.all([
    supabase
      .from('products')
      .select(
        `id, name, slug, short_description, description, base_price, compare_at_price,
         compare_at_starts_at, compare_at_ends_at, size_label, status, featured, category_id,
         ingredients_text, usage_instructions, precautions, track_inventory,
         product_variants ( id, stock_quantity, reserved_quantity, low_stock_threshold ),
         product_images ( storage_path, alt_text, is_primary, width, height )`,
      )
      .eq('id', id)
      .maybeSingle(),
    listCategories(),
  ]);

  if (error || !product) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const variant = product.product_variants?.[0] ?? null;
  const available = variant ? variant.stock_quantity - variant.reserved_quantity : null;
  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0] ?? null;

  // Cada acción redirige de vuelta a la misma ficha con el resultado en la
  // query string: un Server Action ligado directamente a `<form action>` (sin
  // `useActionState`) no tiene otra forma de devolver un mensaje legible al
  // formulario — silenciar el error habría sido peor que este redirect.
  async function saveProduct(formData: FormData): Promise<void> {
    'use server';
    const result = await updateProduct(id, formData);
    const qs = new URLSearchParams();
    if (!result.ok) qs.set('error', result.error ?? 'No se pudo guardar');
    else if (result.warning) qs.set('warning', result.warning);
    else qs.set('saved', '1');
    redirect(`/admin/products/${id}?${qs.toString()}`);
  }

  async function adjustStockAction(formData: FormData): Promise<void> {
    'use server';
    const result = await adjustStock(formData);
    const qs = new URLSearchParams();
    if (!result.ok) qs.set('error', result.error ?? 'No se pudo ajustar el inventario');
    else qs.set('saved', '1');
    redirect(`/admin/products/${id}?${qs.toString()}`);
  }

  async function uploadImageAction(formData: FormData): Promise<void> {
    'use server';
    const result = await uploadProductImage(id, formData);
    const qs = new URLSearchParams();
    if (!result.ok) qs.set('error', result.error ?? 'No se pudo subir la imagen');
    else qs.set('saved', '1');
    redirect(`/admin/products/${id}?${qs.toString()}`);
  }

  async function removeImageAction(): Promise<void> {
    'use server';
    if (primaryImage) await deleteProductImage(id, primaryImage.storage_path);
    redirect(`/admin/products/${id}?saved=1`);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-body hover:text-rose">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a productos
      </Link>

      <h1 className="mt-4 font-display text-h2">{product.name}</h1>
      <p className="mt-1 text-sm text-muted">/{product.slug} · {product.status === 'active' ? 'Publicado' : 'Borrador'}</p>

      {errorParam ? (
        <p role="alert" className="mt-4 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger">
          {errorParam}
        </p>
      ) : null}
      {warningParam ? (
        <p role="alert" className="mt-4 rounded-sm border border-rose/40 bg-powder/30 p-3 text-sm font-medium text-rose-deep">
          Guardado. {warningParam}
        </p>
      ) : null}
      {saved && !errorParam && !warningParam ? (
        <p role="status" className="mt-4 rounded-sm border border-success/40 bg-success/10 p-3 text-sm font-medium text-success">
          Cambios guardados.
        </p>
      ) : null}

      {/* -------------------------------------------------------------- */}
      {/* Imagen                                                          */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="image-heading" className="mt-8 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="image-heading" className="text-h3">Fotografía</h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-sm border border-line bg-ivory">
            {primaryImage ? (
              <Image
                src={imageUrl(supabaseUrl, primaryImage.storage_path)}
                alt={primaryImage.alt_text}
                width={primaryImage.width}
                height={primaryImage.height}
                className="size-full object-contain"
              />
            ) : (
              <div className="grid size-full place-items-center text-center text-xs text-muted">Sin foto</div>
            )}
          </div>

          <form action={uploadImageAction} className="min-w-0 flex-1 space-y-3">
            <div>
              <label htmlFor="image" className="block text-sm font-medium">
                Subir nueva foto (reemplaza la principal)
              </label>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
                className="mt-1 block w-full text-sm"
              />
            </div>
            <div>
              <label htmlFor="altText" className="block text-sm font-medium">
                Texto alternativo (obligatorio)
              </label>
              <input
                id="altText"
                type="text"
                name="altText"
                required
                placeholder="Describe lo que se ve, sin repetir el nombre del producto"
                className="mt-1 block min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="min-h-10 rounded-xs bg-rose px-5 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
              >
                Subir foto
              </button>
              {primaryImage ? (
                <button
                  formAction={removeImageAction}
                  className="min-h-10 rounded-xs border border-ink/25 px-4 text-sm font-medium transition-colors hover:border-danger hover:text-danger"
                >
                  Quitar foto actual
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Inventario                                                      */}
      {/* -------------------------------------------------------------- */}
      <section aria-labelledby="stock-heading" className="mt-6 rounded-sm border border-line bg-white-warm p-5">
        <h2 id="stock-heading" className="text-h3">Inventario</h2>
        {variant ? (
          <>
            <p className="mt-2 text-sm text-body">
              Disponible: <strong className="tabular">{available}</strong> unidades
              {variant.reserved_quantity > 0 ? ` (${variant.reserved_quantity} reservadas en pedidos en curso)` : ''}.
            </p>
            <form action={adjustStockAction} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="variantId" value={variant.id} />
              <div>
                <label htmlFor="newQuantity" className="block text-sm font-medium">
                  Nueva cantidad en stock
                </label>
                <input
                  id="newQuantity"
                  type="number"
                  name="newQuantity"
                  min={0}
                  defaultValue={variant.stock_quantity}
                  required
                  className="mt-1 min-h-10 w-32 rounded-xs border border-line-strong bg-white-warm px-3 text-sm tabular"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="reason" className="block text-sm font-medium">
                  Motivo del ajuste (obligatorio)
                </label>
                <input
                  id="reason"
                  type="text"
                  name="reason"
                  required
                  placeholder="Ej: reposición de proveedor, conteo físico…"
                  className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="min-h-10 rounded-xs bg-rose px-5 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
              >
                Guardar
              </button>
            </form>
          </>
        ) : (
          <p className="mt-2 text-sm text-body">Este producto no tiene variante de inventario.</p>
        )}
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Detalles del producto                                          */}
      {/* -------------------------------------------------------------- */}
      <form action={saveProduct} className="mt-6 space-y-5 rounded-sm border border-line bg-white-warm p-5">
        <h2 className="text-h3">Detalles</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={product.name}
            required
            className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="shortDescription" className="block text-sm font-medium">Descripción corta</label>
          <input
            id="shortDescription"
            name="shortDescription"
            type="text"
            defaultValue={product.short_description ?? ''}
            className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Descripción larga</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ''}
            className="mt-1 w-full rounded-xs border border-line-strong bg-white-warm px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sizeLabel" className="block text-sm font-medium">Tamaño</label>
            <input
              id="sizeLabel"
              name="sizeLabel"
              type="text"
              defaultValue={product.size_label ?? ''}
              placeholder="115 mL"
              className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium">Categoría</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product.category_id ?? ''}
              className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium">Precio (USD)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={toUnits(cents(product.base_price))}
              required
              className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm tabular"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="featured" name="featured" type="checkbox" defaultChecked={product.featured} className="size-5" />
            <label htmlFor="featured" className="text-sm font-medium">Producto destacado (aparece en el home)</label>
          </div>
        </div>

        {/* Precio anterior: campos separados, con aviso de por qué existen las
            fechas — la base de datos rechaza un precio tachado sin vigencia
            real (constraint `compare_at_needs_dates`), y este formulario no
            intenta esquivar esa regla, la explica. */}
        <fieldset className="rounded-xs border border-dashed border-line-strong p-4">
          <legend className="px-1 text-sm font-semibold text-rose-deep">Precio anterior (opcional)</legend>
          <p className="text-xs text-muted">
            Solo se muestra tachado en el sitio si tiene fecha de inicio y fin reales. Un descuento permanente no está
            permitido — es publicidad engañosa.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium">Precio anterior (USD)</label>
              <input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={product.compare_at_price ? toUnits(cents(product.compare_at_price)) : ''}
                className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm tabular"
              />
            </div>
            <div>
              <label htmlFor="compareAtStartsAt" className="block text-sm font-medium">Vigente desde</label>
              <input
                id="compareAtStartsAt"
                name="compareAtStartsAt"
                type="date"
                defaultValue={toDateInputValue(product.compare_at_starts_at)}
                className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="compareAtEndsAt" className="block text-sm font-medium">Vigente hasta</label>
              <input
                id="compareAtEndsAt"
                name="compareAtEndsAt"
                type="date"
                defaultValue={toDateInputValue(product.compare_at_ends_at)}
                className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
              />
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="usageInstructions" className="block text-sm font-medium">Modo de uso</label>
          <textarea
            id="usageInstructions"
            name="usageInstructions"
            rows={3}
            defaultValue={product.usage_instructions ?? ''}
            className="mt-1 w-full rounded-xs border border-line-strong bg-white-warm px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="ingredientsText" className="block text-sm font-medium">Ingredientes (INCI)</label>
          <textarea
            id="ingredientsText"
            name="ingredientsText"
            rows={3}
            defaultValue={product.ingredients_text ?? ''}
            className="mt-1 w-full rounded-xs border border-line-strong bg-white-warm px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="precautions" className="block text-sm font-medium">Precauciones</label>
          <textarea
            id="precautions"
            name="precautions"
            rows={2}
            defaultValue={product.precautions ?? ''}
            className="mt-1 w-full rounded-xs border border-line-strong bg-white-warm px-3 py-2 text-sm"
          />
        </div>

        <p className="rounded-xs border border-dashed border-line-strong bg-ivory p-3 text-xs leading-relaxed text-body">
          Estos son cosméticos: evita palabras como &ldquo;cura&rdquo;, &ldquo;elimina&rdquo;, &ldquo;clínicamente
          probado&rdquo; o &ldquo;crecimiento capilar&rdquo;. Si el texto guardado contiene alguna, el panel te avisará
          después de guardar para que lo revises — no bloquea el guardado, pero sí lo señala.
        </p>

        <button
          type="submit"
          className="min-h-11 rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
