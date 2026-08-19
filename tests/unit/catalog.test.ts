import { describe, expect, it } from 'vitest';
import { filterCatalogProducts, type SearchableProduct } from '@/lib/catalog/query';

const PRODUCTS = [
  { name: 'Sérum Vellos Encarnados', shortDescription: 'Cuidado post depilación', price: 4000, categorySlug: 'aceites-y-serums', needSlugs: ['post-depilacion'] },
  { name: 'Exfoliante de Coco', shortDescription: 'Exfoliación suave', price: 4000, categorySlug: 'exfoliacion', needSlugs: ['textura'] },
  { name: 'Aceite Anti-Estrías', shortDescription: 'Hidratación y brillo', price: 5000, categorySlug: 'aceites-y-serums', needSlugs: ['hidratacion', 'estrias'] },
] satisfies readonly SearchableProduct[];

describe('catalog queries', () => {
  it('filters by category without leaking products from another category', async () => {
    const products = filterCatalogProducts(PRODUCTS, { category: 'exfoliacion' });
    expect(products.map((product) => product.name)).toEqual(['Exfoliante de Coco']);
  });

  it('searches accent-insensitively', async () => {
    const products = filterCatalogProducts(PRODUCTS, { q: 'serum' });
    expect(products.some((product) => product.name === 'Sérum Vellos Encarnados')).toBe(true);
  });

  it('sorts prices using integer minor units', async () => {
    const products = filterCatalogProducts(PRODUCTS, { sort: 'price-asc' });
    expect(products.map((product) => product.price)).toEqual(
      [...products].map((product) => product.price).sort((a, b) => a - b),
    );
  });

  it('returns an empty list for a term with no match', () => {
    expect(filterCatalogProducts(PRODUCTS, { q: 'zz-no-match' })).toEqual([]);
  });
});
