import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Product } from '@/lib/catalog/products';
import { formatMoney } from '@/lib/commerce/money';
import { cn } from '@/lib/utils/cn';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import { QuickAdd, FavoriteToggle } from '@/components/products/product-actions';
import { ProductImage } from '@/components/media/site-image';
import { Stars } from '@/components/ui/stars';

/**
 * Tarjeta de producto.
 *
 * -----------------------------------------------------------------------------
 * SEPARACIÓN EN CAPAS
 *
 * Tres capas con contraste real: sección (crema/rosa/blanco, según dónde se
 * monte) → TARJETA MARFIL con borde propio → packshot sobre su fondo. La
 * franja marfil separa el fondo de la sección del fondo de la fotografía, y
 * el envase queda enmarcado en vez de diluido.
 *
 * La foto va `object-contain`: nunca se recorta tapa, gotero, laterales o
 * base, pase lo que pase con la proporción del tile.
 * -----------------------------------------------------------------------------
 *
 * LO QUE SIGUE SIN RENDERIZARSE, Y POR QUÉ:
 *   · Estrellas/reseñas — solo si `reviewCount` (dato real de
 *     `product_review_stats`, ver `getReviewSummaries`) es > 0. La mayoría de
 *     productos siguen sin reseñas todavía.
 *   · Precio anterior y % de ahorro — no existe un precio anterior con vigencia.
 *   · Segunda foto al hover — solo si `product.images[1]` existe de verdad.
 *   · Badge — es contenido editorial que decide quien llama a la tarjeta
 *     (ver `FEATURED_BADGES` en `collection.tsx`), no un dato del catálogo.
 */
export function ProductCard({
  product,
  priority = false,
  className,
  locale,
  badge,
  averageRating,
  reviewCount,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
  locale: Locale;
  /** Etiqueta editorial opcional ("Best seller", "For him"...), ya traducida. */
  badge?: string;
  /** De `product_review_stats`. Solo se pinta si `reviewCount` es > 0. */
  averageRating?: number;
  reviewCount?: number;
}) {
  const href = localizedHref(locale, `/products/${product.slug}`);
  const secondImage = product.images[1];

  return (
    <article
      className={cn(
        // Rejilla de tres filas: media / contenido / acciones.
        // La fila central es la única elástica (`1fr`), así que el precio y los
        // botones quedan clavados al fondo en las cuatro tarjetas sin depender
        // de que las descripciones midan lo mismo.
        'group relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-[12px] border border-line bg-white-warm',
        'shadow-subtle transition-[box-shadow,transform] duration-300 ease-soft',
        'motion-safe:hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
    >
      {/* Área fotográfica 4:5. Sin padding interno: con `object-contain` nada
          se recorta, así que el único margen entre el envase y el borde del
          tile es el que ya trae la foto — reducirlo a cero es lo que hace que
          el producto se vea lo más grande posible dentro de esta proporción. */}
      <div className="relative aspect-[4/5]" style={{ backgroundColor: product.imageBackground }}>
        <ProductImage
          src={product.image}
          alt={product.imageAlt}
          width={product.imageWidth}
          height={product.imageHeight}
          priority={priority}
          sizes="(max-width: 639px) 85vw, (max-width: 1023px) 44vw, 23vw"
          // El hover no es un `scale` plano: es la misma idea de
          // `product-packshot.tsx` (foto como objeto en el espacio, no
          // sticker) en dosis mínima — `perspective()` inline evita tener que
          // envolver el tile en un contenedor 3D aparte. Solo con
          // `motion-safe`, igual que el resto del sitio. Si hay segunda foto,
          // esta se desvanece para dejarla ver (`secondImage &&` abajo); si
          // no la hay, se queda tal cual con su propio tilt.
          className={cn(
            'transition-[transform,opacity] duration-300 ease-editorial motion-safe:group-hover:[transform:perspective(900px)_rotateX(3deg)_rotateY(-5deg)_scale(1.03)]',
            secondImage && 'motion-safe:group-hover:opacity-0',
          )}
        />

        {secondImage ? (
          <ProductImage
            src={secondImage.src}
            alt={secondImage.alt}
            width={secondImage.width}
            height={secondImage.height}
            sizes="(max-width: 639px) 85vw, (max-width: 1023px) 44vw, 23vw"
            className="absolute inset-0 object-cover! opacity-0 transition-opacity duration-300 ease-editorial motion-safe:group-hover:opacity-100"
          />
        ) : null}

        {badge ? (
          <span className="absolute left-3 top-3 z-10 rounded-pill bg-rose-deep px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.1em] text-white-warm">
            {badge}
          </span>
        ) : null}

        {/* Esquina superior derecha de la foto, no de la fila de acciones. */}
        <FavoriteToggle
          slug={product.slug}
          productName={product.name}
          locale={locale}
          variant="overlay"
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h3 className="font-sans text-md font-semibold leading-snug tracking-[-0.01em]">
          {/* Stretched link: el `after` cubre toda la tarjeta, así que la
              fotografía también es clicable, pero solo hay UNA parada de teclado
              y el nombre del producto es el nombre accesible del enlace. Los
              botones de acción llevan `relative z-10` para quedar por encima. */}
          <Link
            href={href}
            prefetch={false}
            className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-rose"
          >
            {product.name}
          </Link>
        </h3>

        {/* Sin `min-h`: la fila elástica de la rejilla ya absorbe la diferencia
            entre descripciones de una y dos líneas. Reservar altura aquí solo
            añadía blanco muerto en las tarjetas de texto corto. */}
        <p className="mt-1.5 text-sm leading-snug text-body">{product.shortDescription}</p>

        {reviewCount ? (
          <p className="mt-1.5 flex items-center gap-1.5">
            <Stars rating={Math.round(averageRating ?? 0)} size="size-3" />
            <span className="text-2xs text-muted">
              {(averageRating ?? 0).toFixed(1)} ·{' '}
              {pick(
                locale,
                `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`,
                `${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'}`,
              )}
            </span>
          </p>
        ) : null}

        {/* Mismo lenguaje visual que el badge "Pendiente de detalle" de
            Ingredientes: borde discontinuo + reloj, para que una ficha con
            menos información se lea como "en curso", no como una tarjeta
            rota o más pobre sin explicación. */}
        {product.contentComplete === false ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.1em] text-muted">
            <Clock className="size-2.5" strokeWidth={2} aria-hidden="true" />
            {pick(locale, 'More detail coming', 'Ficha en ampliación')}
          </span>
        ) : null}
      </div>

      {/* Fila de acciones, siempre al fondo. */}
      <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="flex items-baseline gap-2">
          {/* Más peso que el tamaño: es el dato que de verdad decide la compra. */}
          <span className="tabular text-lg font-bold tracking-[-0.01em]">
            {formatMoney(product.price, 'USD', locale === 'en' ? 'en-US' : 'es-US')}
          </span>
          <span className="text-xs text-muted">{product.sizeLabel}</span>
        </p>

        {/* `relative z-10` lo saca de debajo del stretched link. */}
        <div className="relative z-10 mt-3">
          <QuickAdd
            slug={product.slug}
            productName={product.name}
            locale={locale}
            inStock={product.inStock}
            variant="solid"
          />
        </div>
      </div>
    </article>
  );
}
