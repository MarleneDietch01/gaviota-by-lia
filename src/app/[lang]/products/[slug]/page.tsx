import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ProductCard } from '@/components/products/product-card';
import { QuickAdd, FavoriteToggle } from '@/components/products/product-actions';
import { ProductGallery } from '@/components/products/product-gallery';
import { ProductReviews } from '@/components/products/product-reviews';
import { getTrustPoints } from '@/components/sections/trust-strip';
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
  // Prioriza la misma categoría; si no alcanza para 3, rellena con el resto
  // del catálogo — nunca al revés, para que "también puede gustarte" de
  // verdad recomiende lo más parecido primero.
  const RELATED_COUNT = 3;
  const otherProducts = (await getAllProducts(lang)).filter((item) => item.slug !== slug);
  const sameCategory = otherProducts.filter((item) => item.categorySlug === product.categorySlug);
  const otherCategory = otherProducts.filter((item) => item.categorySlug !== product.categorySlug);
  const related = [...sameCategory, ...otherCategory].slice(0, RELATED_COUNT);

  const siteUrl = getSiteUrl();
  const category = CATEGORIES.find((item) => item.slug === product.categorySlug)!;
  const categoryName = lang === 'es' ? category.es : category.en;
  const breadcrumbItems = [
    { label: pick(lang, 'Shop', 'Tienda'), href: '/shop' },
    { label: categoryName, href: `/categories/${category.slug}` },
    { label: product.name },
  ];
  const trustPoints = getTrustPoints(lang);

  return (
    <div className="pb-24 lg:pb-0">
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
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ProductGallery images={product.images} priority />

            <div className="self-center lg:py-5">
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
              {product.contentComplete === false ? (
                <span className="hero-rise mt-2 inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.1em] text-muted">
                  <Clock className="size-2.5" strokeWidth={2} aria-hidden="true" />
                  {pick(lang, 'More detail coming', 'Ficha en ampliación')}
                </span>
              ) : null}
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
                <QuickAdd slug={product.slug} productName={product.name} locale={lang} inStock={product.inStock} />
                <FavoriteToggle slug={product.slug} productName={product.name} locale={lang} />
              </div>

              {/* Prueba de compra: datos operativos reales, visibles antes de
                  pedir la acción. No se añaden urgencias ni inventario falso. */}
              <ul className="mt-8 grid max-w-xl gap-4 border-y border-line py-5 sm:grid-cols-3 sm:gap-0">
                {trustPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <li key={point.title} className="flex gap-3 sm:px-4 sm:first:pl-0 sm:not-last:border-r sm:not-last:border-line">
                      <Icon className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden="true" />
                      <div>
                        <p className="text-meta font-semibold leading-snug text-ink">{point.title}</p>
                        <p className="mt-0.5 text-caption leading-snug text-body">{point.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
      {product.ingredients || product.precautions || product.usageInstructions ? (
        <Section tone="powder">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
              <div className="max-w-md">
                <p className="eyebrow mb-4 text-rose-deep">{pick(lang, 'The ritual', 'El ritual')}</p>
                <h2 className="text-h2">{pick(lang, 'Make time for your skin.', 'Haz espacio para tu piel.')}</h2>
                <p className="mt-5 text-lead text-body">
                  {pick(
                    lang,
                    'A few intentional minutes can turn everyday body care into a moment of your own.',
                    'Unos minutos intencionales pueden convertir el cuidado corporal de cada día en un momento tuyo.',
                  )}
                </p>
              </div>

              {/* Acordeones nativos, mismo patrón que el footer móvil
                  (`site-footer.tsx`): sin JS de cliente, `[&::-webkit-details-marker]:hidden`
                  para el icono propio. El primero abierto por defecto — es el
                  que más se consulta antes de comprar. */}
              <div className="divide-y divide-line-strong/60 rounded-sm bg-white-warm shadow-subtle">
                {product.usageInstructions ? (
                  <details className="group p-6 sm:p-8" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="eyebrow text-rose">{pick(lang, 'How to use', 'Modo de uso')}</span>
                      <span aria-hidden="true" className="text-lg text-rose transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm leading-relaxed text-body">
                      {product.usageInstructions}
                    </p>
                  </details>
                ) : null}
                {product.ingredients ? (
                  <details className="group p-6 sm:p-8">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="eyebrow text-rose">{pick(lang, 'Ingredients', 'Ingredientes')}</span>
                      <span aria-hidden="true" className="text-lg text-rose transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm leading-relaxed text-body">{product.ingredients}</p>
                  </details>
                ) : null}
                {product.precautions ? (
                  <details className="group p-6 sm:p-8">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="eyebrow text-rose">{pick(lang, 'Precautions', 'Precauciones')}</span>
                      <span aria-hidden="true" className="text-lg text-rose transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm leading-relaxed text-body">{product.precautions}</p>
                  </details>
                ) : null}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}
      <Section tone={product.ingredients || product.precautions || product.usageInstructions ? 'ivory' : 'powder'}>
        <Container size="narrow">
          <ProductReviews slug={product.slug} locale={lang} />
        </Container>
      </Section>
      {related.length > 0 ? (
      <Section tone="white">
        <Container>
          <p className="eyebrow text-rose">{pick(lang, 'Your next step', 'Tu siguiente paso')}</p>
          <h2 className="mt-4 text-h2">{pick(lang, 'Complete your ritual.', 'Completa tu ritual.')}</h2>
          <p className="mt-4 max-w-xl text-lead text-body">
            {pick(
              lang,
              'Pair it with other body-care essentials, chosen to accompany your routine.',
              'Acompáñalo con otros esenciales de cuidado corporal para seguir construyendo tu rutina.',
            )}
          </p>
          <Rule className="my-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} locale={lang} />
            ))}
          </div>
        </Container>
      </Section>
      ) : null}
      {/* La acción sigue disponible después de explorar ingredientes y productos
          relacionados. Solo aparece en móvil, donde el CTA de la ficha deja de
          estar visible al avanzar por la página. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-5 py-3 shadow-drawer backdrop-blur-sm lg:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 shrink">
            <p className="truncate text-meta font-semibold text-ink">{product.name}</p>
            <p className="text-caption text-body">
              {formatMoney(product.price, 'USD', lang === 'es' ? 'es-US' : 'en-US')}
            </p>
          </div>
          <QuickAdd slug={product.slug} productName={product.name} locale={lang} inStock={product.inStock} />
        </div>
      </div>
    </div>
  );
}
