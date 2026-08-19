import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Product } from '@/lib/catalog/products';
import { formatMoney } from '@/lib/commerce/money';
import { cn } from '@/lib/utils/cn';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import { QuickAdd, FavoriteToggle } from '@/components/products/product-actions';
import { ProductImage } from '@/components/media/site-image';

/**
 * Tarjeta de producto.
 *
 * -----------------------------------------------------------------------------
 * SEPARACIÓN EN TRES CAPAS
 *
 * La versión anterior era rosa sobre rosa sobre rosa: sección `powder`, tile con
 * el color muestreado de cada foto, y foto rosa dentro. Los tres tonos eran
 * parecidos pero distintos, así que el borde del JPEG se veía como un rectángulo
 * flotando — la tarjeta se leía como imagen rota.
 *
 * Ahora hay tres capas con contraste real:
 *     sección rosa empolvado  →  TARJETA MARFIL  →  packshot sobre fondo propio
 *
 * La franja marfil separa el rosa del fondo del rosa de la fotografía, y el
 * envase queda enmarcado en vez de diluido.
 *
 * La foto va `object-contain` en un tile cuadrado porque los packshots se
 * generan ya a 1:1 con el envase completo y aire óptico normalizado (ver
 * scripts/crops.mjs). Así nunca se recortan tapa, gotero, laterales o base.
 * -----------------------------------------------------------------------------
 *
 * LO QUE SIGUE SIN RENDERIZARSE, Y POR QUÉ:
 *   · Estrellas — el catálogo tiene `reviewCount: 0` en todos los productos.
 *   · Precio anterior y % de ahorro — no existe un precio anterior con vigencia.
 *   · Badges "Más vendido" / "Pocas unidades" — sin histórico ni stock real.
 *   · Segunda foto al hover — solo hay una fotografía por producto.
 */
export function ProductCard({
  product,
  priority = false,
  className,
  locale,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
  locale: Locale;
}) {
  const href = localizedHref(locale, `/products/${product.slug}`);

  return (
    <article
      className={cn(
        // Rejilla de tres filas: media / contenido / acciones.
        // La fila central es la única elástica (`1fr`), así que el precio y los
        // botones quedan clavados al fondo en las cuatro tarjetas sin depender
        // de que las descripciones midan lo mismo.
        'group relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-sm bg-white-warm',
        'transition-shadow duration-500 ease-soft hover:shadow-lift',
        className,
      )}
    >
      {/* Área fotográfica CUADRADA e idéntica en las cuatro tarjetas.
          Antes era 4:5 y producía tarjetas altas y estrechas en las que los
          tarros —anchos y bajos— se ampliaban hasta parecer una macro. */}
      <div className="aspect-square" style={{ backgroundColor: product.imageBackground }}>
        <ProductImage
          src={product.image}
          alt={product.imageAlt}
          width={product.imageWidth}
          height={product.imageHeight}
          priority={priority}
          sizes="(max-width: 639px) 72vw, (max-width: 1023px) 44vw, 23vw"
          // `object-contain`: el packshot ya se genera cuadrado con el envase
          // completo y su aire alrededor, así que no hay nada que recortar — y
          // si el tile cambiara de proporción, seguiría sin cortar tapas ni bases.
          //
          // El hover ya no es un `scale` plano: es la misma idea de
          // `product-packshot.tsx` (foto como objeto en el espacio, no
          // sticker) en dosis mínima — `perspective()` inline evita tener que
          // envolver el tile en un contenedor 3D aparte. Solo con
          // `motion-safe`, igual que el resto del sitio.
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:[transform:perspective(900px)_rotateX(3deg)_rotateY(-5deg)_scale(1.03)]"
        />
      </div>

      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <h3 className="font-sans text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em]">
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

        {/* Mismo lenguaje visual que el badge "Pendiente de detalle" de
            Ingredientes: borde discontinuo + reloj, para que una ficha con
            menos información se lea como "en curso", no como una tarjeta
            rota o más pobre sin explicación. */}
        {product.contentComplete === false ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted">
            <Clock className="size-2.5" strokeWidth={2} aria-hidden="true" />
            {pick(locale, 'More detail coming', 'Ficha en ampliación')}
          </span>
        ) : null}
      </div>

      {/* Fila de acciones, siempre al fondo. */}
      <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="flex items-baseline gap-2">
          <span className="tabular text-[1.0625rem] font-semibold tracking-[-0.01em]">
            {formatMoney(product.price, 'USD', locale === 'en' ? 'en-US' : 'es-US')}
          </span>
          <span className="text-xs text-muted">{product.sizeLabel}</span>
        </p>

        {/* `relative z-10` los saca de debajo del stretched link. */}
        <div className="relative z-10 mt-3 flex items-stretch gap-2">
          <QuickAdd slug={product.slug} productName={product.name} locale={locale} />
          <FavoriteToggle slug={product.slug} productName={product.name} locale={locale} />
        </div>
      </div>
    </article>
  );
}
