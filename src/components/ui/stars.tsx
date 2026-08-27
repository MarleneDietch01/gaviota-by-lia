import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Fila de 5 estrellas, llenas hasta `rating`. Puramente decorativa —
 *  `aria-hidden`; el texto que la acompaña (ej. "4.8 · 12 reviews") es lo que
 *  se lee en voz alta. */
export function Stars({ rating, size = 'size-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, n <= rating ? 'fill-rose text-rose' : 'text-line-strong')} />
      ))}
    </div>
  );
}
