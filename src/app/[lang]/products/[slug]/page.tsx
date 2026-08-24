import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ProductCard } from '@/components/products/product-card';
import { QuickAdd, FavoriteToggle } from '@/components/products/product-actions';
import { ProductPackshot } from '@/components/products/product-packshot';
import { ProductReviews } from '@/components/products/product-reviews';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { CATEGORIES, getAllProducts, getProductBySlug } from '@/lib/catalog/products';
import { formatMoney } from '@/lib/commerce/money';
import { isLocale, localizedHref, pageAlternates, pick, socialMeta } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site-url';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/structured-data';

type Props = PageProps<'/[lang]/products/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const product = await getProductBySlug(slug, lang);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: pageAlternates(lang, `/products/${slug}`),
    ...socialMeta(lang, `/products/${slug}`, product.shortDescription, {
      url: product.image,
      width: product.imageWidth,
      height: product.imageHeight,
      alt: product.imageAlt,
    }),
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const product = await getProductBySlug(slug, lang);
  if (!product) notFound();
  const related = (await getAllProducts(lang)).filter((item) => item.slug !== slug).slice(0, 3);

  const siteUrl = getSiteUrl();
  const category = CATEGORIES.find((item) => item.slug === product.categorySlug)!;
  const categoryName = lang === 'es' ? category.es : category.en;
  const breadcrumbItems = [
    { label: pick(lang, 'Shop', 'Tienda'), href: '/shop' },
    { label: categoryName, href: `/categories/${category.slug}` },
    { label: product.name },
  ];

  return (
    <>
      {/* JSON estático generado en servidor, sin datos de usuario — no hay
          riesgo de inyección al usar dangerouslySetInnerHTML aquí. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, lang, siteUrl)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: pick(lang, 'Home', 'Inicio'), url: `${siteUrl}${localizedHref(lang, '/')}` },
              { name: pick(lang, 'Shop', 'Tienda'), url: `${siteUrl}${localizedHref(lang, '/shop')}` },
              { name: categoryName, url: `${siteUrl}${localizedHref(lang, `/categories/${category.slug}`)}` },
              { name: product.name, url: `${siteUrl}${localizedHref(lang, `/products/${product.slug}`)}` },
            ]),
          ),
        }}
      />
      <Section tone="ivory" padding="compact">
        <Container>
          <Breadcrumbs items={breadcrumbItems} locale={lang} />
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <ProductPackshot
              src={product.image}
              alt={product.imageAlt}
              width={product.imageWidth}
              height={product.imageHeight}
              priority
            />

            <div className="self-center">
              <p className="eyebrow hero-rise text-rose">
                {pick(lang, 'Body care', 'Cuidado corporal')}
              </p>
              <h1
                className="hero-rise mt-4 text-h1"
                style={{ '--rise-delay': '80ms' } as React.CSSProperties}
              >
                {product.name}
              </h1>
              <p
                className="hero-rise mt-5 text-lead text-body"
                style={{ '--rise-delay': '160ms' } as React.CSSProperties}
              >
                {product.shortDescription}
              </p>
              <p
                className="hero-rise mt-6 text-xl font-semibold"
                style={{ '--rise-delay': '220ms' } as React.CSSProperties}
              >
                {formatMoney(product.price, 'USD', lang === 'es' ? 'es-US' : 'en-US')}{' '}
                <span className="text-sm font-normal text-muted">· {product.sizeLabel}</span>
              </p>
              <p
                className="hero-rise mt-5 text-sm leading-relaxed text-body"
                style={{ '--rise-delay': '280ms' } as React.CSSProperties}
              >
                {pick(
                  lang,
                  'Availability and final price are verified before checkout. No unconfirmed rating, stock or claim is shown.',
                  'La disponibilidad y el precio final se verifican antes del checkout. No mostramos ratings, stock ni claims sin confirmar.',
                )}
              </p>
              <div
                className="hero-rise mt-7 flex max-w-md gap-3"
                style={{ '--rise-delay': '340ms' } as React.CSSProperties}
              >
                <QuickAdd slug={product.slug} productName={product.name} locale={lang} />
                <FavoriteToggle slug={product.slug} productName={product.name} locale={lang} />
              </div>
            </div>
          </div>
        </Container>
      </Section>
      {product.ingredients || product.precautions || product.usageInstructions ? (
        <Section tone="powder">
          <Container size="narrow">
            <h2 className="text-h2">{pick(lang, 'Good to know', 'Lo que debes saber')}</h2>
            <Rule className="my-8" />
            <dl className="divide-y divide-line-strong/60 rounded-sm bg-white-warm">
              {product.usageInstructions ? (
                <div className="p-6 sm:p-7">
                  <dt className="eyebrow text-rose">{pick(lang, 'How to use', 'Modo de uso')}</dt>
                  <dd className="mt-3 text-[0.9375rem] leading-relaxed text-body">
                    {product.usageInstructions}
                  </dd>
                </div>
              ) : null}
              {product.ingredients ? (
                <div className="p-6 sm:p-7">
                  <dt className="eyebrow text-rose">{pick(lang, 'Ingredients', 'Ingredientes')}</dt>
                  <dd className="mt-3 text-[0.9375rem] leading-relaxed text-body">{product.ingredients}</dd>
                </div>
              ) : null}
              {product.precautions ? (
                <div className="p-6 sm:p-7">
                  <dt className="eyebrow text-rose">{pick(lang, 'Precautions', 'Precauciones')}</dt>
                  <dd className="mt-3 text-[0.9375rem] leading-relaxed text-body">{product.precautions}</dd>
                </div>
              ) : null}
            </dl>
          </Container>
        </Section>
      ) : null}
      <Section tone={product.ingredients || product.precautions || product.usageInstructions ? 'ivory' : 'powder'}>
        <Container size="narrow">
          <ProductReviews slug={product.slug} locale={lang} />
        </Container>
      </Section>
      <Section tone="white">
        <Container>
          <h2 className="text-h2">{pick(lang, 'You may also like', 'También puede gustarte')}</h2>
          <Rule className="my-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} locale={lang} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
