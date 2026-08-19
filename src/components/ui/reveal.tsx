'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Aparición suave al entrar en viewport.
 *
 * Por qué no `framer-motion`: la dependencia ya está en el package.json, pero
 * son ~50 KB de JavaScript de cliente para un fade-up de 18px. Aquí se resuelve
 * con un IntersectionObserver (que ya trae el navegador) y dos reglas CSS en
 * globals.css. El componente pesa lo que ocupa este archivo.
 *
 * Reglas de seguridad que respeta:
 *
 *   · Si el usuario pide menos movimiento, el CSS de `[data-reveal]` ni siquiera
 *     existe (está dentro de `@media (prefers-reduced-motion: no-preference)`),
 *     así que el contenido se ve de entrada. No hay riesgo de dejarlo invisible.
 *   · Si IntersectionObserver no existe, se marca como visible de inmediato.
 *   · Se observa una sola vez y se desconecta: nada queda escuchando scroll.
 *   · No envuelve nada crítico del primer viewport — el hero usa una animación
 *     CSS pura sin JS.
 */
export function Reveal({
  children,
  as: Tag = 'div' as ElementType,
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Retardo en ms. Úsalo para escalonar hermanos, máximo ~3 pasos. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.dataset['reveal'] = 'shown';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `bottom <= 0` cubre el scroll rápido: si el usuario pasa de largo
          // más deprisa de lo que el observer muestrea, el elemento queda por
          // encima del viewport sin haber "entrado" nunca. Sin esta condición
          // se quedaría invisible para siempre, que es el peor fallo posible
          // de una animación de entrada.
          if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) {
            (entry.target as HTMLElement).dataset['reveal'] = 'shown';
            observer.unobserve(entry.target);
          }
        }
      },
      // Se dispara un poco antes de que el bloque llegue al borde inferior: así
      // la animación termina justo cuando el usuario lo está mirando.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
      className={className ? cn(className) : undefined}
    >
      {children}
    </Tag>
  );
}
