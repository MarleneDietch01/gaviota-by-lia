import { MapPin, Leaf, Beaker, Sparkles } from 'lucide-react';
import { Container, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { BENEFITS, t } from '@/lib/content/home-data';
import { pick, type Locale } from '@/lib/i18n';

const ICONS = {
  origin: MapPin,
  leaf: Leaf,
  batch: Beaker,
  ritual: Sparkles,
} as const;

/**
 * Beneficios rápidos.
 *
 * Va justo bajo el hero y es visible EN TODOS LOS ANCHOS. La barra equivalente
 * anterior era `hidden lg:block`: las señales de confianza —lo que más pesa en
 * la conversión de una marca de belleza— no las veía el tráfico móvil, que es
 * la mayoría.
 *
 * En móvil es una rejilla de 2×2 y no un carrusel: cuatro elementos cortos
 * caben, y un carrusel escondería la mitad tras un gesto.
 */
export function Benefits({ locale }: { locale: Locale }) {
  return (
    <Section tone="white" padding="compact" labelledBy="benefits-title">
      <Container>
        <h2 id="benefits-title" className="sr-only">
          {pick(locale, 'Why Gaviota by Lia', 'Por qué Gaviota by Lia')}
        </h2>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10">
          {BENEFITS.map((benefit, i) => {
            const Icon = ICONS[benefit.icon];
            return (
              <Reveal as="li" key={benefit.icon} delay={i * 70}>
                <span className="grid size-11 place-items-center rounded-pill bg-powder/50">
                  <Icon className="size-5 text-rose-deep" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-sans text-body-sm font-semibold leading-snug tracking-[-0.01em]">
                  {t(benefit.title, locale)}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-body">
                  {t(benefit.body, locale)}
                </p>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
