import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog/catalog-page';
import { isCatalogSort, isCategorySlug, type CatalogQuery } from '@/lib/catalog/products';
import { isLocale, pick } from '@/lib/i18n';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: PageProps<'/[lang]/shop'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: pick(lang, 'Shop Body Care', 'Tienda de cuidado corporal'),
    description: pick(lang, 'Explore Gaviota by Lia body oils, creams, scrubs and serums.', 'Descubre aceites, cremas, exfoliantes y sérums corporales Gaviota by Lia.'),
    alternates: { canonical: `/${lang}/shop` },
  };
}

export default async function ShopPage({ params, searchParams }: PageProps<'/[lang]/shop'> & { searchParams: SearchParams }) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const query = parseCatalogQuery(raw);

  return (
    <CatalogPage
      locale={lang}
      eyebrow={pick(lang, 'The collection', 'La colección')}
      title={pick(lang, 'Body care, made into ritual.', 'Cuidado corporal hecho ritual.')}
      description={pick(lang, 'Explore thoughtful formulas created to hydrate, soften and elevate your everyday body care.', 'Descubre fórmulas creadas para hidratar, suavizar y elevar tu cuidado corporal de cada día.')}
      query={query}
      breadcrumbs={[{ label: pick(lang, 'Shop', 'Tienda') }]}
    />
  );
}

export function parseCatalogQuery(raw: Record<string, string | string[] | undefined>): CatalogQuery {
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : undefined;
  const category = typeof raw.category === 'string' && isCategorySlug(raw.category) ? raw.category : undefined;
  const sort = typeof raw.sort === 'string' && isCatalogSort(raw.sort) ? raw.sort : undefined;
  return {
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(sort ? { sort } : {}),
  };
}
