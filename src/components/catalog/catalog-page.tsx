import Link from 'next/link';
import type { ReactNode } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/navigation/breadcrumbs';
import { ProductCard } from '@/components/products/product-card';
import { Container } from '@/components/ui/layout-primitives';
import {
  CATEGORIES,
  queryProducts,
  type CatalogQuery,
  type CatalogSort,
  type CategorySlug,
} from '@/lib/catalog/products';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

export interface CatalogPageProps {
  readonly locale: Locale;
  readonly title: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly query: CatalogQuery;
  readonly breadcrumbs: readonly BreadcrumbItem[];
  readonly lockCategory?: CategorySlug;
  readonly formPath?: '/shop' | '/search';
}

export async function CatalogPage({
  locale,
  title,
  description,
  eyebrow,
  query,
  breadcrumbs,
  lockCategory,
  formPath = '/shop',
}: CatalogPageProps) {
  const effectiveQuery = lockCategory ? { ...query, category: lockCategory } : query;
  const products = await queryProducts(effectiveQuery, locale);
  const shopHref = localizedHref(locale, '/shop');
  const formAction = localizedHref(locale, formPath);

  return (
    <div className="bg-ivory">
      <Container className="pb-16 pt-5 sm:pb-20 lg:pb-28 lg:pt-8">
        <Breadcrumbs items={breadcrumbs} locale={locale} />

        <header className="max-w-3xl pb-10 pt-8 sm:pb-12 lg:pb-14 lg:pt-12">
          <p className="eyebrow mb-3 text-rose">{eyebrow}</p>
          <h1 className="text-h1">{title}</h1>
          <p className="mt-4 max-w-2xl text-lead text-body">{description}</p>
        </header>

        <form action={formAction} className="border-y border-line py-5" role="search">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.55fr)_minmax(12rem,0.55fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-body">
                {pick(locale, 'Search products', 'Buscar productos')}
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query.q}
                  placeholder={pick(locale, 'Oil, cream, scrub…', 'Aceite, crema, exfoliante…')}
                  className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm pl-10 pr-4 text-sm placeholder:text-muted"
                />
              </span>
            </label>

            {lockCategory ? (
              <input type="hidden" name="category" value={lockCategory} />
            ) : (
              <SelectField
                name="category"
                label={pick(locale, 'Category', 'Categoría')}
                defaultValue={query.category ?? ''}
              >
                <option value="">{pick(locale, 'All categories', 'Todas las categorías')}</option>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {locale === 'es' ? category.es : category.en}
                  </option>
                ))}
              </SelectField>
            )}

            <SelectField
              name="sort"
              label={pick(locale, 'Sort by', 'Ordenar por')}
              defaultValue={query.sort ?? 'featured'}
            >
              <option value="featured">{pick(locale, 'Featured', 'Destacados')}</option>
              <option value="price-asc">{pick(locale, 'Price: low to high', 'Precio: menor a mayor')}</option>
              <option value="price-desc">{pick(locale, 'Price: high to low', 'Precio: mayor a menor')}</option>
            </SelectField>

            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-ink sm:self-end lg:self-auto">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {pick(locale, 'Apply', 'Aplicar')}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 py-7">
          <p role="status" className="text-sm text-body">
            <strong className="font-semibold text-ink">{products.length}</strong>{' '}
            {products.length === 1
              ? pick(locale, 'product', 'producto')
              : pick(locale, 'products', 'productos')}
          </p>
          {(query.q || query.category || (query.sort && query.sort !== 'featured')) ? (
            <Link href={shopHref} className="min-h-11 py-3 text-sm font-semibold text-rose underline underline-offset-4">
              {pick(locale, 'Clear filters', 'Limpiar filtros')}
            </Link>
          ) : null}
        </div>

        {products.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-5 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-7 xl:gap-y-12">
            {products.map((product) => (
              <li key={product.slug} className="h-full">
                <ProductCard product={product} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-y border-line py-16 text-center sm:py-20">
            <h2 className="font-display text-h3">
              {pick(locale, 'No products found', 'No encontramos productos')}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-body">
              {pick(locale, 'Try a broader term or clear the current filters.', 'Prueba un término más general o elimina los filtros actuales.')}
            </p>
            <Link href={shopHref} className="mt-7 inline-flex min-h-12 items-center rounded-xs border border-ink/55 px-6 text-sm font-semibold hover:bg-ink hover:text-white-warm">
              {pick(locale, 'See all products', 'Ver todos los productos')}
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: CatalogSort | CategorySlug | '';
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-body">{label}</span>
      <select name={name} defaultValue={defaultValue} className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm">
        {children}
      </select>
    </label>
  );
}
