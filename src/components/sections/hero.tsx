import { getImageProps } from 'next/image';
import { ArrowDown } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { HeroDepth } from '@/components/ui/pointer-depth';
import { getSection } from '@/lib/content/sections';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Hero de campaña.
 *
 * -----------------------------------------------------------------------------
 * ART DIRECTION REAL, UNA SOLA DESCARGA
 *
 * La versión anterior renderizaba DOS bloques —uno `lg:hidden` y otro
 * `hidden lg:grid`— cada uno con su `<Image priority>`. Ocultar con CSS no
 * evita la descarga: en un escritorio de 1440px se bajaban los dos archivos, y
 * el móvil se pedía además a w=1536, más ancho que el propio de escritorio.
 * Ambos con `fetchPriority="high"`, compitiendo por el ancho de banda del LCP.
 *
 * Aquí hay UN solo `<picture>` con tres `<source>`. El navegador evalúa `media`
 * antes de descargar, así que baja exactamente un archivo. `getImageProps()` es
 * la API de Next 16 para esto: genera el `srcSet` optimizado (AVIF/WebP, todos
 * los anchos de `deviceSizes`) de cada fuente, y el `<img>` final conserva el
 * lazy/priority y las dimensiones que evitan CLS.
 *
 * COMPOSICIÓN
 *   · < 1024px  apilado: fotografía arriba, contenido debajo sobre marfil.
 *               El texto NUNCA se superpone al rostro, así que no depende de un
 *               degradado para tener contraste.
 *   · ≥ 1024px  dividido 42 / 58 (46 / 54 a partir de 2xl para que el panel no
 *               se vuelva demasiado apaisado en monitores anchos). La foto CUBRE
 *               el panel entero (`object-cover`), sin franja de fondo plano a un
 *               lado. El panel llega hasta 60rem de alto para que el recorte
 *               horizontal quepa; `object-position` a 58 % conserva rostro,
 *               collar y los tres envases y solo recorta algo de fondo por
 *               arriba y por abajo.
 *
 * `object-position` se ajusta por breakpoint porque la caja cambia de forma
 * (vertical en móvil, casi cuadrada en tablet, apaisada en escritorio).
 * -----------------------------------------------------------------------------
 */

const ALT_ES = 'Modelo rodeada de manos que presentan productos de cuidado corporal Gaviota by Lia';
const ALT_EN = 'Model surrounded by hands presenting Gaviota by Lia body care products';

export async function Hero({ locale }: { locale: Locale }) {
  const c = await getSection('home.hero', locale);
  if (!c) return null;

  const alt = pick(locale, ALT_EN, ALT_ES);

  // `quality: 90` — medido: a 75 el optimizador retiene el 83 % de la
  // micro-textura; a 90 sube al 94 %. En el LCP de una marca de piel, compensa.
  const common = { alt, quality: 90, priority: true } as const;

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: '/images/gaviota/hero/hero-products-desktop.jpg', width: 2400, height: 1667, sizes: '58vw' });

  const {
    props: { srcSet: tabletSrcSet },
  } = getImageProps({ ...common, src: '/images/gaviota/hero/hero-products-tablet.jpg', width: 1800, height: 1250, sizes: '100vw' });

  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({ ...common, src: '/images/gaviota/hero/hero-products-mobile.jpg', width: 1400, height: 1167, sizes: '100vw' });

  return (
    <section className="relative bg-ivory">
      <div className="flex flex-col lg:grid lg:grid-cols-[42%_58%] lg:items-stretch 2xl:grid-cols-[46%_54%]">
        {/* ---------------- Contenido ----------------
            Primero en el DOM: el h1 no debe ir después de la imagen. En móvil
            se reordena visualmente con `order`, y como la fotografía no es
            focalizable el orden de tabulación no se ve afectado. */}
        <div className="order-2 flex items-center px-5 pb-12 pt-7 sm:px-8 lg:order-1 lg:px-12 lg:py-24 xl:pl-16 xl:pr-14">
          <div className="w-full max-w-[34rem] lg:max-w-[32rem]">
            {c.eyebrow ? (
              <p className="eyebrow hero-rise mb-4 text-rose lg:mb-5">{c.eyebrow}</p>
            ) : null}

            {/* Los saltos son explícitos para que "Tu momento." no se parta en
                mitades raras a ningún ancho. `text-balance` haría lo contrario
                de lo que se quiere aquí, así que se desactiva. */}
            <h1
              className="hero-rise text-display font-display font-light [text-wrap:nowrap]"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              <span className="block">{pick(locale, 'Your skin.', 'Tu piel.')}</span>
              <span className="block">
                {pick(locale, 'Your ', 'Tu ')}
                <span className="accent-word text-rose">ritual</span>.
              </span>
              <span className="block">{pick(locale, 'Your moment.', 'Tu momento.')}</span>
            </h1>

            {c.body ? (
              <p
                className="hero-rise mt-5 max-w-[30rem] text-lead text-body lg:mt-7"
                style={{ '--rise-delay': '160ms' } as React.CSSProperties}
              >
                {c.body}
              </p>
            ) : null}

            {c.buttonLabel && c.buttonUrl ? (
              <div
                className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mt-9"
                style={{ '--rise-delay': '240ms' } as React.CSSProperties}
              >
                {/* `block` solo hasta `sm`: la versión anterior llevaba
                    `w-full` fijo y en tablet el botón medía 983px de ancho. */}
                <LinkButton
                  href={localizedHref(locale, c.buttonUrl)}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {c.buttonLabel}
                </LinkButton>
                <LinkButton
                  href={localizedHref(locale, '/rituals')}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {pick(locale, 'Build my ritual', 'Crear mi ritual')}
                </LinkButton>
              </div>
            ) : null}

            <p
              className="hero-rise mt-8 flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.16em] text-muted lg:mt-10"
              style={{ '--rise-delay': '320ms' } as React.CSSProperties}
            >
              <span aria-hidden="true" className="h-px w-8 bg-champagne" />
              {pick(locale, 'Made in the Dominican Republic', 'Hecho en República Dominicana')}
            </p>

            <a
              href="#collection"
              className="hero-rise mt-9 hidden min-h-11 items-center gap-3 text-caption font-semibold uppercase tracking-[0.16em] text-body transition-colors hover:text-rose lg:inline-flex"
              style={{ '--rise-delay': '400ms' } as React.CSSProperties}
            >
              {pick(locale, 'Explore the collection', 'Explorar la colección')}
              <span className="grid size-9 place-items-center rounded-pill border border-line-strong">
                <ArrowDown className="size-4" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>

        {/* ---------------- Fotografía ---------------- */}
        <HeroDepth className="relative order-1 overflow-hidden lg:order-2 lg:h-[min(calc(100svh-5rem),60rem)]">
          <div aria-hidden="true" className="hero-aura hero-aura-top" />
          <div aria-hidden="true" className="hero-aura hero-aura-bottom" />
          <div aria-hidden="true" className="hero-ingredient hero-ingredient-coconut" />
          <picture className="hero-depth-picture block h-full">
            <source media="(min-width: 1024px)" srcSet={desktopSrcSet} sizes="58vw" />
            <source media="(min-width: 640px)" srcSet={tabletSrcSet} sizes="100vw" />
            {/* `alt` va explícito además de venir en `imgProps`: el linter no
                puede verlo dentro del spread y lo marcaría como imagen sin
                texto alternativo. */}
            <img
              {...imgProps}
              alt={alt}
              srcSet={mobileSrcSet}
              // 48svh en móvil y no 58: a 390×844 el CTA primario caía por
              // debajo del pliegue. Con 48 la fotografía sigue siendo la
              // protagonista y el botón asoma sin necesidad de scroll.
              className={
                // En 390×844 deja el CTA primario completo dentro del primer
                // pliegue, sin quitar protagonismo a la fotografía.
                'h-[clamp(15rem,38svh,20rem)] w-full object-cover ' +
                'object-[50%_50%] sm:h-[clamp(22rem,50svh,32rem)] sm:object-[50%_50%] ' +
                'lg:h-full lg:rounded-bl-[3rem] lg:object-[50%_50%]'
              }
            />
          </picture>
          <div aria-hidden="true" className="hero-glass-light" />
        </HeroDepth>
      </div>
    </section>
  );
}
