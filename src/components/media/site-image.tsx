import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

type SharedProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  quality?: 75 | 90;
};

/**
 * Packshot de catálogo. La regla es deliberadamente rígida: el producto se
 * muestra completo y nunca cambia a `cover`, aunque el contenedor cambie.
 */
export function ProductImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  priority = false,
  quality = 90,
}: SharedProps & { width: number; height: number }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={cn('size-full object-contain object-center', className)}
    />
  );
}

/** Foto editorial con crop controlado por un punto focal explícito. */
export function EditorialImage({
  src,
  alt,
  width,
  height,
  sizes,
  focal,
  fit = 'cover',
  className,
  priority = false,
  quality = 90,
}: SharedProps & {
  width: number;
  height: number;
  focal: string;
  fit?: 'cover' | 'contain';
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain', className)}
      style={{ objectPosition: focal }}
    />
  );
}

/** Variante `fill` para bloques de campaña cuya altura depende del contenido. */
export function FillEditorialImage({
  src,
  alt,
  sizes,
  focal,
  className,
  priority = false,
  quality = 90,
}: SharedProps & { focal: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={cn('object-cover', className)}
      style={{ objectPosition: focal }}
    />
  );
}
