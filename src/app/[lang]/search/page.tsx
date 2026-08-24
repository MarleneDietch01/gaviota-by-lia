import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog/catalog-page';
import { isCatalogSort, isCategorySlug, type CatalogQuery } from '@/lib/catalog/products';
import { isLocale, pageAlternates, pick, socialMeta } from '@/lib/i18n';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: PageProps<'/[lang]/search'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const description = pick(lang, 'Search Gaviota by Lia body care products.', 'Busca productos de cuidado corporal Gaviota by Lia.');
  return {
    title: pick(lang, 'Search', 'Buscar'),
    description,
    robots: { index: false, follow: true },
    alternates: pageAlternates(lang, '/search'),
    ...socialMeta(lang, '/search', description),
  };
}

export default async function SearchPage({ params, searchParams }: PageProps<'/[lang]/search'> & { searchParams: SearchParams }) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : '';
  const category = typeof raw.category === 'string' && isCategorySlug(raw.category) ? raw.category : undefined;
  const sort = typeof raw.sort === 'string' && isCatalogSort(raw.sort) ? raw.sort : undefined;
  const query: CatalogQuery = {
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(sort ? { sort } : {}),
  };

  return (
    <CatalogPage
      locale={lang}
      eyebrow={pick(lang, 'Search', 'Buscar')}
      title={q ? pick(lang, `Results for “${q}”`, `Resultados para “${q}”`) : pick(lang, 'Find your next ritual.', 'Encuentra tu próximo ritual.')}
      description={pick(lang, 'Search by product name, format or the care you want to focus on.', 'Busca por nombre, formato o el cuidado en el que quieres enfocarte.')}
      query={query}
      formPath="/search"
      breadcrumbs={[{ label: pick(lang, 'Search', 'Buscar') }]}
    />
  );
}
