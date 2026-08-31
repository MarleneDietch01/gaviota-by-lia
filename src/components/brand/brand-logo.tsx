import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

const OFFICIAL_LOGO = '/images/gaviota/brand/logo-oficial-transparent.png';

/** Renderiza siempre el archivo oficial completo, sin reconstruir la marca. */
export function BrandLogo({
  className,
  priority = false,
  sizes,
}: {
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <Image
      src={OFFICIAL_LOGO}
      alt="Gaviota by Lia"
      width={1369}
      height={574}
      sizes={sizes}
      priority={priority}
      quality={90}
      className={cn('h-auto object-contain', className)}
    />
  );
}
