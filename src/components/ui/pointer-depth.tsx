'use client';

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type DepthVars = React.CSSProperties & {
  '--depth-x'?: string;
  '--depth-y'?: string;
  '--depth-scroll'?: string;
};

export function HeroDepth({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const updateScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
        element.style.setProperty('--depth-scroll', `${progress * 12}px`);
      });
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty('--depth-x', x.toFixed(3));
    event.currentTarget.style.setProperty('--depth-y', y.toFixed(3));
  };

  const reset = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--depth-x', '0');
    event.currentTarget.style.setProperty('--depth-y', '0');
  };

  return (
    <div
      ref={ref}
      className={cn('hero-depth', className)}
      style={{ '--depth-x': '0', '--depth-y': '0', '--depth-scroll': '0px' } as DepthVars}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}

export function ProductTilt({ children, className }: { children: ReactNode; className?: string }) {
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${((x - 0.5) * 6).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
  };

  const reset = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <article
      className={cn('product-tilt', className)}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </article>
  );
}
