import type { CatalogQuery, CategorySlug, NeedSlug } from '@/lib/catalog/products';

export interface SearchableProduct {
  readonly name: string;
  readonly shortDescription: string;
  readonly price: number;
  readonly categorySlug: CategorySlug;
  readonly needSlugs: readonly NeedSlug[];
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

/** Lógica pura compartida por la fuente local actual y la futura fuente DB. */
export function filterCatalogProducts<T extends SearchableProduct>(
  source: readonly T[],
  query: CatalogQuery,
): T[] {
  let products = [...source];

  if (query.category) {
    products = products.filter((product) => product.categorySlug === query.category);
  }

  const term = query.q?.trim();
  if (term) {
    const needle = normalize(term);
    products = products.filter((product) =>
      normalize(`${product.name} ${product.shortDescription} ${product.categorySlug} ${product.needSlugs.join(' ')}`).includes(needle),
    );
  }

  if (query.sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (query.sort === 'price-desc') products.sort((a, b) => b.price - a.price);

  return products;
}
