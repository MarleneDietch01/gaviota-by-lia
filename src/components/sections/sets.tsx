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
/**
 * Foto del kit por idioma: son dos archivos distintos, no la misma imagen
 * traducida por CSS — el flyer en inglés tiene su propio recorte/proporción
 * (1122×1402) porque el texto en inglés es más largo que en español
 * (1254×1254, cuadrado). Ambas ya llevan fondo blanco propio, así que el
 * plinto ya no necesita un color de fondo muestreado (a diferencia de
 * `coleccion-completa.jpg`, que sí lo llevaba).
 */
const KIT_IMAGE = {
  es: { src: '/images/gaviota/products/kit.png', width: 1254, height: 1254 },
  en: { src: '/images/gaviota/products/kit-en.png', width: 1122, height: 1402 },
} as const;

export async function Sets({ locale }: { locale: Locale }) {
  const c = await getSection('home.kits', locale);
  if (!c) return null;

  const kitImage = KIT_IMAGE[locale];

  return (
    <Section tone="powder" labelledBy="sets-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="set-visual frame-arch bg-white-warm">
            <div className="aspect-[4/3]">
              <EditorialImage
                src={kitImage.src}
                alt={pick(
                  locale,
                  'Gaviota by Lia Stretch Mark & Brightening Kit: stretch mark body oil, hydrating body cream and coconut body scrub',
                  'Kit Anti-Estrías y Aclaración Gaviota by Lia: aceite anti-estrías, crema hidratante y exfoliante de coco',
                )}
                width={kitImage.width}
                height={kitImage.height}
                sizes="(min-width: 1024px) 48vw, 100vw"
                focal="50% 50%"
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
                  <span className="text-body-sm leading-snug">
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
