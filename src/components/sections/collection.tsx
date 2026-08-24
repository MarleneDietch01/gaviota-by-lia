import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { ProductCard } from '@/components/products/product-card';
import { getSection } from '@/lib/content/sections';
import { getFeaturedProducts } from '@/lib/catalog/products';
import { localizedHref, type Locale } from '@/lib/i18n';

/**
 * Productos favoritos.
 *
 * Se titula "los favoritos" y no "más vendidos": no hay histórico de ventas
 * propio todavía, así que la selección es la de productos marcados a mano como
 * destacados. Cuando existan ventas reales, el orden saldrá de ellas.
 *
 * Rejilla: 4 en escritorio, 2 en tablet, carrusel táctil en móvil. El carrusel
 * usa `scroll-snap` de CSS — no hay librería, y con teclado sigue siendo una
 * lista navegable con scroll nativo.
 */
export async function Collection({ locale }: { locale: Locale }) {
  const c = await getSection('home.bestsellers', locale);
  const products = await getFeaturedProducts(locale);

  if (!c || products.length === 0) return null;

  return (
    <Section tone="powder" id="collection" labelledBy="collection-title">
      {/* `wide`, no el ancho por defecto: esta es una rejilla de 4 columnas de
          producto, igual que Comunidad más abajo — las dos únicas secciones
          del home con una rejilla ancha de tarjetas/fotos usan el mismo
          `size="wide"` en vez de que cada una invente su propio valor de
          `max-width` (antes esta sección llevaba un `xl:max-w-[82rem]` suelto
          por `className`, un ancho que no existía en ningún otro sitio del
          home). Ver el comentario de `Container` en `layout-primitives.tsx`
          para el sistema completo. */}
      <Container size="wide">
        <SectionHeader
          id="collection-title"
          eyebrow={c.eyebrow}
          title={c.title ?? ''}
          subtitle={c.subtitle}
          tone="powder"
        />

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
            {products.map((product) => (
              <li
                key={product.slug}
                className="w-[72%] shrink-0 snap-start sm:w-auto sm:shrink"
              >
                <ProductCard product={product} priority={false} locale={locale} />
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Más cerca de la rejilla (mt-10 en vez de mt-12) y en primario: en
            secundario, con borde `ink/25` sobre rosa empolvado, el botón se leía
            como una nota al pie en vez de como el cierre de la sección. No
            compite con el primario del hero porque no coinciden en pantalla. */}
        {c.buttonLabel && c.buttonUrl ? (
          <div className="mt-10 text-center">
            <LinkButton
              href={localizedHref(locale, c.buttonUrl)}
              variant="primary"
              size="lg"
            >
              {c.buttonLabel}
            </LinkButton>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
