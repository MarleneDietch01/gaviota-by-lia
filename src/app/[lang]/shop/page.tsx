import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog/catalog-page';
import { isCatalogSort, isCategorySlug, type CatalogQuery } from '@/lib/catalog/products';
import { isLocale, pageAlternates, pick, socialMeta } from '@/lib/i18n';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: PageProps<'/[lang]/shop'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const description = pick(lang, 'Shop Dominican body oils, coconut scrub, hydrating cream and ingrown hair serum. Gaviota by Lia body care with shipping within the USA.', 'Compra aceites corporales, exfoliante de coco, crema hidratante y sérum post-depilación. Cuidado corporal dominicano con envíos en Estados Unidos.');
  return {
    title: pick(lang, 'Shop Body Care', 'Tienda de cuidado corporal'),
    description,
    alternates: pageAlternates(lang, '/shop'),
    ...socialMeta(lang, '/shop', description),
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
      description={pick(lang, 'Oils, creams and scrubs for your daily care. Shop in USD with U.S. shipping.', 'Aceites, cremas y exfoliantes para tu cuidado diario. Compra en dólares con envíos en EE. UU.')}
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
