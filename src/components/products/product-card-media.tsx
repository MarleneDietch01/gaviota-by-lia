'use client';

import { useState } from 'react';
import { Eye, Package } from 'lucide-react';
import { ProductImage } from '@/components/media/site-image';
import type { Product } from '@/lib/catalog/products';
import { pick, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

type ProductImageItem = Product['images'][number];

/**
 * Media de tarjeta con dos entradas equivalentes:
 * - mouse: transición al pasar el cursor;
 * - mobile/tablet: botón explícito para alternar producto ↔ uso.
 */
export function ProductCardMedia({
  product,
  secondImage,
  priority,
  locale,
}: {
  product: Product;
  secondImage: ProductImageItem | undefined;
  priority: boolean;
  locale: Locale;
}) {
  const [showSecondary, setShowSecondary] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleImage = () => {
    setHasInteracted(true);
    setShowSecondary((current) => !current);
  };

  return (
    <>
      <ProductImage
        src={product.image}
        alt={product.imageAlt}
        width={product.imageWidth}
        height={product.imageHeight}
        priority={priority}
        sizes="(max-width: 639px) 85vw, (max-width: 1023px) 44vw, 23vw"
        className={cn(
          'transition-[transform,opacity] duration-300 ease-editorial motion-reduce:transition-none motion-safe:group-hover:[transform:perspective(900px)_rotateX(3deg)_rotateY(-5deg)_scale(1.03)]',
          secondImage && 'motion-safe:group-hover:opacity-0',
          hasInteracted && (showSecondary ? 'opacity-0!' : 'transform-none! opacity-100!'),
        )}
      />

      {secondImage ? (
        <ProductImage
          src={secondImage.src}
          alt={secondImage.alt}
          width={secondImage.width}
          height={secondImage.height}
          sizes="(max-width: 639px) 85vw, (max-width: 1023px) 44vw, 23vw"
          className={cn(
            'absolute inset-0 object-cover! opacity-0 transition-opacity duration-300 ease-editorial motion-reduce:transition-none motion-safe:group-hover:opacity-100',
            hasInteracted && (showSecondary ? 'opacity-100!' : 'opacity-0!'),
          )}
        />
      ) : null}

      <span aria-hidden="true" className="product-card-sheen" />

      {secondImage ? (
        <button
          type="button"
          onClick={toggleImage}
          aria-pressed={showSecondary}
          aria-label={
            showSecondary
              ? pick(locale, 'Show product image', 'Mostrar imagen del producto')
              : pick(locale, 'Show product in use', 'Mostrar producto en uso')
          }
          className="absolute bottom-3 right-3 z-20 inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-ink/10 bg-white-warm/95 px-3 text-xs font-semibold text-ink shadow-subtle backdrop-blur-sm transition-colors hover:bg-white-warm lg:hidden"
        >
          {showSecondary ? (
            <Package className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {showSecondary
            ? pick(locale, 'View product', 'Ver producto')
            : pick(locale, 'View in use', 'Ver en uso')}
        </button>
      ) : null}
    </>
  );
}
