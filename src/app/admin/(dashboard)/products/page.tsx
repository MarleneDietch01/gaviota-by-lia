import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';
import { setProductStatus } from './actions';

export const metadata = { title: 'Productos' };

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  active: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
};

const STATUS_TONE: Record<string, string> = {
  active: 'bg-success/15 text-success',
  draft: 'bg-line text-body',
  archived: 'bg-danger/10 text-danger',
};

type SearchParams = { q?: string; page?: string };

/**
 * Publica o despublica desde la lista, sin entrar a la ficha — es la acción
 * que la dueña necesita más a menudo ("agotado hasta que reponga" ==
 * despublicar). Reutiliza `setProductStatus`, la misma Server Action que usa
 * el formulario de edición.
 */
async function toggleStatus(formData: FormData): Promise<void> {
  'use server';
  const productId = String(formData.get('productId') ?? '');
  const nextStatus = String(formData.get('nextStatus') ?? '') as 'active' | 'draft';
  if (!productId || (nextStatus !== 'active' && nextStatus !== 'draft')) return;
  await setProductStatus(productId, nextStatus);
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q = '', page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, base_price, status, featured, size_label, translation_stale, product_variants(stock_quantity, reserved_quantity, low_stock_threshold, status)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: true })
    .range(from, to);

  if (q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }

  const { data: products, count, error } = await query;
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-h2">Productos</h1>
          <p className="mt-1 text-sm text-body">
            {count ?? 0} {count === 1 ? 'producto' : 'productos'} en el catálogo.
          </p>
        </div>
        <Link href="/admin/products/new" className="min-h-10 rounded-xs bg-rose px-5 py-2.5 text-sm font-semibold text-white-warm hover:bg-rose-deep">
          Crear producto
        </Link>
        <form className="flex gap-2" action="/admin/products">
          <label htmlFor="q" className="sr-only">
            Buscar por nombre
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            className="min-h-10 min-w-0 rounded-xs border border-line-strong bg-white-warm px-3 text-sm"
          />
          <button
            type="submit"
            className="min-h-10 shrink-0 rounded-xs border border-ink/25 px-4 text-sm font-medium transition-colors hover:border-ink"
          >
            Buscar
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-danger">No se pudieron cargar los productos: {error.message}</p>
      ) : products && products.length > 0 ? (
        <>
          <div className="mt-8 overflow-x-auto rounded-sm border border-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-white-warm">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Destacado</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const variant = product.product_variants?.[0];
                  const available = variant ? variant.stock_quantity - variant.reserved_quantity : null;
                  const lowStock = variant ? available !== null && available <= variant.low_stock_threshold : false;
                  return (
                    <tr key={product.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-rose">
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted">{product.size_label}</p>
                        {product.translation_stale ? (
                          <span className="mt-1 inline-flex items-center rounded-pill border border-dashed border-line-strong px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.1em] text-muted">
                            Traducción pendiente
                          </span>
                        ) : null}
                      </td>
                      <td className="tabular px-4 py-3">
                        {formatMoney(cents(product.base_price), 'USD', 'es-US')}
                      </td>
                      <td className="px-4 py-3">
                        {available === null ? (
                          <span className="text-muted">Sin control</span>
                        ) : (
                          <span className={lowStock ? 'font-semibold text-danger' : 'tabular'}>
                            {available} {available === 1 ? 'unidad' : 'unidades'}
                            {available === 0 ? ' · Agotado' : lowStock ? ' · Stock bajo' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[product.status] ?? 'bg-line text-body'}`}
                        >
                          {STATUS_LABEL[product.status] ?? product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body">{product.featured ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="mb-2 flex justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`} className="min-h-9 rounded-xs bg-rose px-3 py-2 text-xs font-semibold text-white-warm">Editar</Link>
                          <Link href={`/es/products/${product.slug}`} target="_blank" className="min-h-9 rounded-xs border border-ink/25 px-3 py-2 text-xs font-semibold">Vista previa</Link>
                        </div>
                        <form action={toggleStatus}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            type="hidden"
                            name="nextStatus"
                            value={product.status === 'active' ? 'draft' : 'active'}
                          />
                          <button
                            type="submit"
                            className="min-h-9 rounded-xs border border-ink/25 px-3 text-xs font-semibold transition-colors hover:border-ink"
                          >
                            {product.status === 'active' ? 'Despublicar' : 'Publicar'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`}
                  aria-current={p === page ? 'page' : undefined}
                  className={`flex min-h-10 min-w-10 items-center justify-center rounded-xs border text-sm ${
                    p === page ? 'border-rose bg-rose/10 font-semibold text-rose-deep' : 'border-line text-body hover:border-ink'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          ) : null}
        </>
      ) : q ? (
        <p className="mt-8 text-sm text-body">Ningún producto coincide con &ldquo;{q}&rdquo;.</p>
      ) : (
        <p className="mt-8 text-sm text-body">Todavía no hay productos en el catálogo.</p>
      )}
    </div>
  );
}
