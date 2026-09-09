import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Fila de 5 estrellas, llenas hasta `rating`. Puramente decorativa —
 *  `aria-hidden`; el texto que la acompaña (ej. "4.8 · 12 reviews") es lo que
 *  se lee en voz alta.
 *
 *  Es un `<span>` con `inline-flex`, no un `<div>`: en tres sitios estas
 *  estrellas viven dentro de un `<p>` (tarjeta de producto, ficha y home), y
 *  un `<div>` ahí es HTML inválido. El navegador lo saca del párrafo al
 *  parsear, el árbol deja de coincidir con el del servidor y React lanza un
 *  error de hidratación. Como bloque, un `<span>` inline-flex se comporta
 *  igual dentro de las filas flex donde también se usa. */
export function Stars({ rating, size = 'size-4' }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, n <= rating ? 'fill-gold-deep text-gold-deep' : 'text-line-strong')} />
      ))}
    </span>
  );
}
