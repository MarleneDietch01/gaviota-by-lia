'use client';

import { useEffect, useRef } from 'react';
import { ProductImage } from '@/components/media/site-image';

const BASE_TILT = { x: 6, y: -14 };

/**
 * Packshot 3D en CSS puro (perspective + transform), sin Three.js: el
 * producto es una foto de estudio real, no un modelo poligonal, así que basta
 * con inclinar la propia foto como si fuera una tarjeta en el espacio,
 * iluminarla con un overlay direccional y apoyarla en una sombra de contacto.
 *
 * El seguimiento del puntero se desactiva por completo con
 * `prefers-reduced-motion`; la inclinación base es una POSE estática (no una
 * animación en el tiempo) así que se mantiene siempre — es lo que separa este
 * bloque del `<div className="aspect-square">` plano que había antes.
 */
export function ProductPackshot({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes = '(max-width: 1023px) 68vw, 40vw',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  sizes?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    // Sin seguimiento del puntero si el usuario pidió menos movimiento: la
    // pose base ya está puesta en línea, así que no se pierde composición.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handleMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${BASE_TILT.x - py * 10}deg) rotateY(${BASE_TILT.y + px * 16}deg)`;
    };

    const handleLeave = () => {
      card.style.transform = `rotateX(${BASE_TILT.x}deg) rotateY(${BASE_TILT.y}deg)`;
    };

    stage.addEventListener('pointermove', handleMove);
    stage.addEventListener('pointerleave', handleLeave);
    return () => {
      stage.removeEventListener('pointermove', handleMove);
      stage.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative aspect-square overflow-hidden rounded-md [perspective:1500px] [perspective-origin:50%_35%]"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 18%, var(--color-white-warm) 0%, var(--color-ivory) 55%, var(--color-powder) 140%)',
      }}
    >
      {/* Mancha de acento difuminada: la marca sin recurrir a un fondo blanco plano. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] -top-[8%] size-[55%] rounded-full opacity-40 blur-3xl"
        style={{ background: 'var(--color-powder)' }}
      />

      <div
        ref={cardRef}
        className="absolute inset-[9%] [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `rotateX(${BASE_TILT.x}deg) rotateY(${BASE_TILT.y}deg)` }}
      >
        <div className="relative size-full overflow-hidden rounded-md shadow-lift">
          <ProductImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes={sizes}
            className="bg-white-warm"
          />
          {/* Luz direccional: overlay sobre la foto, no forma parte del archivo. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 26%, rgba(0,0,0,0) 52%, rgba(110,34,57,0.10) 82%, rgba(110,34,57,0.20) 100%)',
            }}
          />
        </div>
      </div>

      {/* Sombra de contacto: elipse aplanada bajo la foto, no un box-shadow uniforme. */}
      <div
        aria-hidden="true"
        className="absolute bottom-[7%] left-1/2 h-[10%] w-[62%] -translate-x-1/2 blur-md"
        style={{
          transform: 'translateX(-50%) rotateX(85deg)',
          background:
            'radial-gradient(ellipse at center, rgb(110 34 57 / 0.4) 0%, rgb(110 34 57 / 0.16) 45%, rgb(110 34 57 / 0) 75%)',
        }}
      />
      {/* Sombra ambiental: más grande, más suave, más clara — refuerza el asiento en el suelo. */}
      <div
        aria-hidden="true"
        className="absolute bottom-[4%] left-1/2 h-[14%] w-[80%] -translate-x-1/2 blur-xl"
        style={{
          transform: 'translateX(-50%) rotateX(85deg)',
          background:
            'radial-gradient(ellipse at center, rgb(110 34 57 / 0.16) 0%, rgb(110 34 57 / 0) 70%)',
        }}
      />
    </div>
  );
}
