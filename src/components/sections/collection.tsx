import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { ProductCard } from '@/components/products/product-card';
import { getSection } from '@/lib/content/sections';
import { getFeaturedProducts } from '@/lib/catalog/products';
import { getReviewSummaries } from '@/lib/catalog/review-stats';
import { localizedHref, type Locale } from '@/lib/i18n';

/**
 * Etiqueta editorial por producto — decisión de la dueña de qué destacar, no
 * un dato derivado de ventas reales (no hay histórico propio todavía). Vive
 * aquí y no en el catálogo porque es puramente de presentación de esta
 * sección, igual que `NEED_SLUGS_BY_PRODUCT` en `catalog/products.ts` es
 * taxonomía editorial y no una columna de la base de datos.
 */
const FEATURED_BADGES: Record<string, { en: string; es: string }> = {
  'aceite-anti-estrias': { en: 'Best seller', es: 'Más vendido' },
  'tonico-para-barba': { en: 'For him', es: 'Para él' },
};

/**
 * Productos favoritos.
 *
 * Se titula "los favoritos" y no "más vendidos": ver `FEATURED_BADGES` arriba
 * para la única excepción (la propia dueña marcó ese producto como su más
 * vendido). El resto de la selección son productos marcados a mano como
 * destacados.
 *
 * Rejilla: 4 en escritorio, 2 en tablet, carrusel táctil en móvil (1.15
 * tarjetas visibles, para que se note que hay más a la derecha). El carrusel
 * usa `scroll-snap` de CSS — no hay librería, y con teclado sigue siendo una
 * lista navegable con scroll nativo.
 */
export async function Collection({ locale }: { locale: Locale }) {
  const c = await getSection('home.bestsellers', locale);
  const products = await getFeaturedProducts(locale);

  if (!c || products.length === 0) return null;

  const reviewSummaries = await getReviewSummaries(products.map((p) => p.id));

  return (
    <Section tone="blush" id="collection" labelledBy="collection-title">
      {/* `wide`, no el ancho por defecto: esta es una rejilla de 4 columnas de
          producto, igual que Comunidad más abajo — las dos únicas secciones
          del home con una rejilla ancha de tarjetas/fotos usan el mismo
          `size="wide"` en vez de que cada una invente su propio valor de
          `max-width` (antes esta sección llevaba un `xl:max-w-[82rem]` suelto
          por `className`, un ancho que no existía en ningún otro sitio del
          home). `wide` = 1440px. Ver el comentario de `Container` en
          `layout-primitives.tsx` para el sistema completo. */}
      <Container size="wide">
        <SectionHeader
          id="collection-title"
          eyebrow={c.eyebrow}
          title={c.title ?? ''}
          subtitle={c.subtitle}
          tone="powder"
        />

        {/* Enlace discreto, no un botón: la acción principal de esta sección es
            elegir una tarjeta, no "ver todo". Centrado bajo el encabezado para
            no competir con las cuatro tarjetas. */}
        {c.buttonLabel && c.buttonUrl ? (
          <div className="-mt-4 mb-10 text-center sm:-mt-6 sm:mb-14">
            <Link
              href={localizedHref(locale, c.buttonUrl)}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold tracking-[0.01em] text-rose-deep transition-colors hover:text-rose-ink"
            >
              {c.buttonLabel}
              <ArrowRight
                className="size-4 transition-transform duration-300 ease-soft motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        ) : null}

        {/* La animación va en el CONTENEDOR, no en cada tarjeta.
            En móvil esto es un carrusel horizontal: las tarjetas que quedan
            fuera de pantalla a la derecha nunca intersecan con el viewport, así
            que con un Reveal por tarjeta se quedaban a `opacity: 0` de forma
            permanente — medido, 2 de 4 invisibles a 390px. */}
        <Reveal>
          <ul
            className={
              // Móvil: carrusel a sangre (los `-mx-5` compensan el padding del
              // Container para que la primera tarjeta arranque en el borde).
              '-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 ' +
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
              // Difuminado del borde derecho: única pista de que el carrusel
              // sigue fuera de pantalla. Se retira en `sm`, donde ya es rejilla.
              '[mask-image:linear-gradient(to_right,black_86%,transparent)] ' +
              '[-webkit-mask-image:linear-gradient(to_right,black_86%,transparent)] ' +
              // A partir de sm, rejilla normal.
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 ' +
              'sm:[mask-image:none] sm:[-webkit-mask-image:none] ' +
              'lg:grid-cols-4 lg:gap-x-8'
            }
          >
            {products.map((product) => {
              const badgeEntry = FEATURED_BADGES[product.slug];
              const summary = reviewSummaries.get(product.id);

              return (
                <li
                  key={product.slug}
                  // 100/1.15 ≈ 87%: deja ver ~1.15 tarjetas en el viewport móvil.
                  className="w-[87%] shrink-0 snap-start sm:w-auto sm:shrink"
                >
                  <ProductCard
                    product={product}
                    priority={false}
                    locale={locale}
                    {...(badgeEntry ? { badge: badgeEntry[locale] } : {})}
                    {...(summary?.reviewCount
                      ? { averageRating: summary.averageRating, reviewCount: summary.reviewCount }
                      : {})}
                  />
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
