import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Jerarquía de botones. Cuatro niveles, y solo UNO primario por pantalla visible.
 *
 * Contraste medido:
 *   primary   blanco sobre caramel #8A5A3C ............  5.62:1 AA
 *             :hover sobre caramel-deep ................  9.81:1 AA
 *             :active sobre espresso .................... 12.90:1 AA
 *   espresso  blanco sobre espresso #3D2B26 ............ 12.90:1 AA
 *             :hover sobre espresso-deep ............... 15.14:1 AA
 *   secondary ink sobre marfil, borde ink .............. 11.93:1 AA
 *   onDark    espresso sobre blanco cálido ............. 12.90:1 AA
 *             :hover espresso sobre polvo ..............  8.98:1 AA
 *   quiet     caramel sobre marfil .....................  5.20:1 AA
 *
 * `active:scale` se aplica solo con motion-safe: en reduced-motion el botón
 * responde igual pero sin deformarse.
 */

const VARIANTS = {
  primary: 'bg-caramel text-white-warm hover:bg-caramel-deep active:bg-espresso motion-safe:active:scale-[0.98]',
  // `ink` y `espresso` son el mismo hex, así que el hover/active heredados del
  // sistema rosa (bg-wine -> hover:bg-rose-ink, ambos #6e2239) no cambiaban
  // nada. Sobre un plano ya oscuro la respuesta tiene que ser oscurecer.
  espresso: 'bg-espresso text-white-warm hover:bg-espresso-deep active:bg-espresso-deep motion-safe:active:scale-[0.98]',
  secondary:
    'border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-ivory',
  onDark:
    'bg-white-warm text-espresso hover:bg-powder active:bg-powder motion-safe:active:scale-[0.98]',
  onDarkOutline: 'border border-on-dark-soft/50 bg-transparent text-on-dark hover:border-on-dark-soft hover:bg-white-warm/10',
  quiet:
    'bg-transparent text-caramel underline decoration-caramel/35 underline-offset-[6px] hover:text-caramel-deep hover:decoration-caramel-deep',
} as const;

/** Alturas 44/48/52px. 44 es el mínimo táctil accesible; en móvil se sube. */
const SIZES = {
  sm: 'min-h-11 px-5 text-meta',
  md: 'min-h-12 px-7 text-sm',
  lg: 'min-h-13 px-9 text-body-sm',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

const BASE = cn(
  'premium-button inline-flex items-center justify-center gap-2 overflow-hidden text-center',
  'rounded-xs font-sans font-semibold tracking-[0.02em]',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-editorial',
  'disabled:pointer-events-none disabled:opacity-45',
);

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho. Es una prop, no `className="w-full"`, para que el
   *  hero móvil no acabe estirando el botón a 1023px en tablet. */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'>;
type LinkButtonProps = CommonProps & { href: string } & Pick<
    ComponentPropsWithoutRef<'a'>,
    'target' | 'rel' | 'aria-label'
  >;

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Un enlace con aspecto de botón sigue siendo un enlace: usa `<Link>`, no un
 * `<button>` con onClick. Así funcionan el clic con rueda, "abrir en pestaña
 * nueva" y la navegación por teclado.
 */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  href,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
