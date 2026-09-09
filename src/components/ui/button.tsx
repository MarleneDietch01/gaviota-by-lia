import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Jerarquía de botones. Cuatro niveles, y solo UNO primario por pantalla visible.
 *
 * Contraste medido:
 *   primary   espresso sobre champán ................... 5.66:1 AA
 *             :hover/:active sobre oro brillante ....... 9.63:1 AA
 *   secondary espresso sobre crema .................... 11.93:1 AA
 *   onDark    espresso sobre blanco cálido ............ 12.90:1 AA
 *   quiet     gold-deep sobre crema .................... 6.53:1 AA
 *
 * `active:scale` se aplica solo con motion-safe: en reduced-motion el botón
 * responde igual pero sin deformarse.
 */

const VARIANTS = {
  primary: 'bg-champagne text-ink hover:bg-gold active:bg-gold motion-safe:active:scale-[0.98]',
  secondary:
    'border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-ivory',
  onDark:
    'bg-white-warm text-espresso hover:bg-powder active:bg-powder motion-safe:active:scale-[0.98]',
  onDarkOutline: 'border border-on-dark-soft/50 bg-transparent text-on-dark hover:border-on-dark-soft hover:bg-white-warm/10',
  quiet:
    'bg-transparent text-gold-deep underline decoration-gold-deep/35 underline-offset-[6px] hover:text-gold-ink hover:decoration-gold-ink',
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
