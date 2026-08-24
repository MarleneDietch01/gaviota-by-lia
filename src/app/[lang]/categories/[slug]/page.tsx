import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog/catalog-page';
import { CATEGORIES, isCatalogSort, isCategorySlug, type CatalogQuery } from '@/lib/catalog/products';
import { isLocale, pageAlternates, pick, socialMeta } from '@/lib/i18n';

type Params = Promise<{ lang: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !isCategorySlug(slug)) return {};
  const category = CATEGORIES.find((item) => item.slug === slug)!;
  const name = lang === 'es' ? category.es : category.en;
  const description = pick(lang, `Explore ${name.toLowerCase()} by Gaviota by Lia.`, `Descubre ${name.toLowerCase()} de Gaviota by Lia.`);
  return {
    title: name,
    description,
    alternates: pageAlternates(lang, `/categories/${slug}`),
    ...socialMeta(lang, `/categories/${slug}`, description),
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ lang, slug }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang) || !isCategorySlug(slug)) notFound();
  const category = CATEGORIES.find((item) => item.slug === slug)!;
  const name = lang === 'es' ? category.es : category.en;
  const sort = typeof raw.sort === 'string' && isCatalogSort(raw.sort) ? raw.sort : undefined;
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : undefined;
  const query: CatalogQuery = { ...(q ? { q } : {}), ...(sort ? { sort } : {}) };

  return (
    <CatalogPage
      locale={lang}
      eyebrow={pick(lang, 'Shop by category', 'Comprar por categoría')}
      title={name}
      description={pick(lang, 'A focused edit of body care products selected by format and everyday ritual.', 'Una selección de cuidado corporal organizada por formato y ritual cotidiano.')}
      query={query}
      lockCategory={slug}
      breadcrumbs={[{ label: pick(lang, 'Shop', 'Tienda'), href: '/shop' }, { label: name }]}
    />
  );
}
