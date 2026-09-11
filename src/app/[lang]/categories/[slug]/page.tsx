import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog/catalog-page';
import { CATEGORIES, isCatalogSort, isCategorySlug, type CatalogQuery } from '@/lib/catalog/products';
import { isLocale, localizedHref, pageAlternates, pick, socialMeta } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/structured-data';
import { CATEGORY_COPY } from '@/lib/content/category-copy';

type Params = Promise<{ lang: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !isCategorySlug(slug)) return {};
  const { title, description } = CATEGORY_COPY[slug][lang];
  return {
    title,
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
  const siteUrl = getSiteUrl();

  return (
    <>
      {/* `jsonLdScript` escapa `<`: sin eso, un valor que contenga
          `</script>` cerraria la etiqueta y lo siguiente se ejecutaria. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: pick(lang, 'Home', 'Inicio'), url: `${siteUrl}${localizedHref(lang, '/')}` },
              { name: pick(lang, 'Shop', 'Tienda'), url: `${siteUrl}${localizedHref(lang, '/shop')}` },
              { name, url: `${siteUrl}${localizedHref(lang, `/categories/${slug}`)}` },
            ]),
          ),
        }}
      />
      <CatalogPage
        locale={lang}
        eyebrow={pick(lang, 'Shop by category', 'Comprar por categoría')}
        title={CATEGORY_COPY[slug][lang].title}
        description={CATEGORY_COPY[slug][lang].description}
        query={query}
        lockCategory={slug}
        breadcrumbs={[{ label: pick(lang, 'Shop', 'Tienda'), href: '/shop' }, { label: name }]}
      />
    </>
  );
}
