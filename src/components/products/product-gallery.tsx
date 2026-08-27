'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/media/site-image';
import { ProductPackshot } from '@/components/products/product-packshot';
import { cn } from '@/lib/utils/cn';

export interface GalleryImage {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Galería de producto, lista para 1-N fotos.
 *
 * Hoy TODOS los productos tienen exactamente 1 foto real (verificado contra
 * producción antes de construir esto) — con 1 imagen, esto se ve y se
 * comporta exactamente igual que el `ProductPackshot` de antes: mismo tilt
 * 3D, sin tira de miniaturas, sin espacio reservado de sobra. La tira de
 * miniaturas solo aparece cuando `images.length > 1`, así que no hay ningún
 * elemento visual "vacío" esperando fotos que todavía no existen.
 */
export function ProductGallery({
  images,
  priority = false,
}: {
  images: readonly GalleryImage[];
  priority?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0]!;

  return (
    <div>
      <ProductPackshot
        src={active.src}
        alt={active.alt}
        width={active.width}
        height={active.height}
        priority={priority}
      />

      {images.length > 1 ? (
        <div role="tablist" aria-label="Product photos" className="mt-4 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={image.alt}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-xs border transition-colors',
                index === activeIndex ? 'border-rose' : 'border-line hover:border-line-strong',
              )}
            >
              <ProductImage src={image.src} alt="" width={image.width} height={image.height} sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
