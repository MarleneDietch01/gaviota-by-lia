import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/* ===========================================================================
   Container
   ---------------------------------------------------------------------------
   Tres anchos, y un padding lateral que crece con el viewport. El padding es el
   MISMO en todas las secciones: es lo que hace que la columna de texto de una
   sección se alinee con la rejilla de producto de la siguiente.

   SISTEMA DE ANCHOS DEL HOME — cuándo usar cada `size`:
     · `narrow` (44rem) — SOLO secciones de una columna, puramente de texto,
       sin rejilla ni foto grande (Ingredientes, Newsletter). El ancho corto
       es lo que hace legible un párrafo centrado.
     · `default` (75rem) — todo lo demás que no sea explícitamente ancho o a
       sangre: Beneficios, Ritual en 3 pasos, Build your ritual, franja de
       campaña, Fundadora, Sets. Es el ancho por defecto y debe seguir
       siéndolo — no se le pasa un `className` con otro `max-w-*` suelto.
     · `wide` (90rem) — SOLO rejillas de 4 columnas de tarjetas o fotografía
       (Colección, Comunidad). Nunca un tercer valor de ancho inventado a
       medio camino entre `default` y `wide`.
     · Sin `Container` (a sangre completa) — reservado para el hero y el
       bloque editorial de campaña (`Campaign`, tono vino). Son los dos únicos
       momentos del home sin contenedor, y ambos son deliberados: el hero
       porque la fotografía 4:5 necesita su propia composición dividida, la
       campaña porque es el único bloque de foto+texto a página completa.
       Ningún otro componente de sección debe omitir `Container`.
   =========================================================================== */

const CONTAINER_WIDTHS = {
  narrow: 'max-w-[44rem]',
  default: 'max-w-[75rem]',
  wide: 'max-w-[90rem]',
  full: 'max-w-none',
} as const;

export type ContainerSize = keyof typeof CONTAINER_WIDTHS;

export function Container({
  children,
  className,
  size = 'default',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  size?: ContainerSize;
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav';
}) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16',
        CONTAINER_WIDTHS[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ===========================================================================
   Section
   ---------------------------------------------------------------------------
   `tone` es la regla que sostiene el ritmo de la home: la página alterna entre
   cuatro temperaturas y NUNCA repite la misma dos veces seguidas. Es lo que
   evita a la vez el sitio-bloque-rosa y la plantilla blanca genérica.

   `padding` es una prop y no un `className` a propósito: ver el comentario de
   lib/utils/cn.ts. Pasar `className="py-0"` aquí no funcionaría.
   =========================================================================== */

const TONES = {
  ivory: 'bg-ivory text-ink',
  white: 'bg-white-warm text-ink',
  powder: 'bg-powder text-ink',
  wine: 'on-dark bg-wine text-on-dark',
} as const;

const PADDINGS = {
  default: 'py-16 sm:py-20 lg:py-28',
  compact: 'py-12 sm:py-14 lg:py-16',
  tight: 'py-8 sm:py-10',
  none: '',
} as const;

export type Tone = keyof typeof TONES;
export type SectionPadding = keyof typeof PADDINGS;

export function Section({
  children,
  tone = 'ivory',
  padding = 'default',
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: Tone;
  padding?: SectionPadding;
  className?: string;
  id?: string;
  /** id del encabezado que da nombre a la sección, para lectores de pantalla. */
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('relative', TONES[tone], PADDINGS[padding], className)}
    >
      {children}
    </section>
  );
}

/* ===========================================================================
   SectionHeader
   =========================================================================== */

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'light',
  id,
  className,
}: {
  // `| undefined` explícito: con `exactOptionalPropertyTypes`, `?` solo permite
  // omitir la propiedad, no pasarla con valor undefined. El contenido editable
  // devuelve campos opcionales que pueden serlo.
  eyebrow?: string | undefined;
  title: ReactNode;
  subtitle?: string | undefined;
  align?: 'left' | 'center';
  /** `powder` usa rosa profundo: el rosa base no llega a AA sobre rosa. */
  tone?: 'light' | 'powder' | 'dark';
  id?: string;
  className?: string;
}) {
  const eyebrowTone =
    tone === 'dark' ? 'text-on-dark-soft' : tone === 'powder' ? 'text-rose-deep' : 'text-rose';
  const subtitleTone = tone === 'dark' ? 'text-on-dark-soft' : 'text-body';

  return (
    <header
      className={cn(
        'mb-10 sm:mb-14',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow ? <p className={cn('eyebrow mb-3', eyebrowTone)}>{eyebrow}</p> : null}

      <h2 id={id} className={cn('text-h2', tone === 'dark' ? 'text-on-dark' : 'text-ink')}>
        {title}
      </h2>

      {subtitle ? (
        <p className={cn('mt-4 text-lead', subtitleTone, align === 'center' && 'mx-auto')}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

/* ===========================================================================
   Filete champán
   =========================================================================== */

export function Rule({ className }: { className?: string }) {
  return <hr aria-hidden="true" className={cn('rule-champagne w-full', className)} />;
}
