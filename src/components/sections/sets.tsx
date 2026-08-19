import { EditorialImage } from '@/components/media/site-image';
import { Check } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { RITUAL_STEPS, t } from '@/lib/content/home-data';
import { getSection } from '@/lib/content/sections';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Sets / kits.
 *
 * El contenido (`home.kits`) ya existía en `sections.ts` marcado como `active`,
 * pero ningún componente lo renderizaba: la sección estaba escrita y perdida.
 *
 * NO se muestra precio de kit ni ahorro respecto a comprar suelto: no existe un
 * precio de kit confirmado. La sección enlaza a `/kits`, donde vivirá el detalle
 * cuando el dato exista. Inventar un "ahorras un 15 %" sería exactamente el tipo
 * de descuento sin vigencia que este proyecto decidió no replicar.
 */
export async function Sets({ locale }: { locale: Locale }) {
  const c = await getSection('home.kits', locale);
  if (!c) return null;

  return (
    <Section tone="powder" labelledBy="sets-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* `#e69fa3` no es un valor inventado: es el color de fondo real de
              `coleccion-completa.jpg`, muestreado por `scripts/process-images.mjs`
              y registrado en `image-manifest.json` como `collection.all.background`.
              Mismo patrón que `imageBackground` en `products.ts` — el plinto usa el
              tono exacto de la foto para que el recorte `fit="contain"` no deje ver
              el borde rectangular del JPEG contra la tarjeta marfil. */}
          <Reveal className="frame-arch bg-white-warm">
            <div className="aspect-[4/3] bg-[#e69fa3]">
              <EditorialImage
                src="/images/gaviota/editorial/coleccion-completa.jpg"
                alt={pick(
                  locale,
                  'Gaviota by Lia products grouped as a complete routine set',
                  'Productos Gaviota by Lia agrupados como kit de rutina completa',
                )}
                width={2000}
                height={2500}
                sizes="(min-width: 1024px) 48vw, 100vw"
                focal="50% 52%"
                fit="contain"
              />
            </div>
          </Reveal>

          <Reveal delay={80} className="max-w-[32rem]">
            {c.eyebrow ? <p className="eyebrow mb-4 text-rose-deep">{c.eyebrow}</p> : null}

            <h2 id="sets-title" className="text-h2">
              {c.title}
            </h2>

            {c.subtitle ? (
              <p className="mt-4 text-lead leading-relaxed text-body">{c.subtitle}</p>
            ) : null}

            {/* Los tres pasos del ritual, que son los tres productos del kit.
                Dato real: sale de RITUAL_STEPS, no de una lista inventada. */}
            <ul className="mt-8 space-y-3">
              {RITUAL_STEPS.map((step) => (
                <li key={step.n} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-rose-deep"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  <span className="text-[0.9375rem] leading-snug">
                    <strong className="font-semibold">{t(step.verb, locale)}</strong>
                    <span className="text-body"> — {t(step.product, locale)}</span>
                  </span>
                </li>
              ))}
            </ul>

            {c.buttonLabel && c.buttonUrl ? (
              <div className="mt-9">
                <LinkButton href={localizedHref(locale, c.buttonUrl)} size="lg">
                  {c.buttonLabel}
                </LinkButton>
              </div>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
