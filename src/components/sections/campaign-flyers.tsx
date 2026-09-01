import { Check } from 'lucide-react';
import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { CAMPAIGN_BENEFITS, t } from '@/lib/content/home-data';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Franja de beneficios de campaña.
 *
 * Antes eran dos imágenes de flyer (rosa/azul) con todo el texto incrustado en
 * el píxel: no traducía a /en, no era accesible ni indexable por buscadores, y
 * llevaban un QR, un WhatsApp y un dominio propio que no corresponden a ningún
 * canal verificado del sitio actual. Reconstruida con maquetación real —
 * bullets como texto (`CAMPAIGN_BENEFITS`, en `home-data.ts`).
 *
 * Las fotos de antes/después y los claims de aclarado de piel / crecimiento de
 * barba que llevaban los flyers originales NO se republican: quedan anotados
 * como bloqueados por aprobación en `docs/LEGAL_TODO.md` (L13), con el mismo
 * criterio que L8. Los archivos originales siguen en `editorial/` por si hace
 * falta recuperar algo puntual, pero ya no los referencia ningún componente.
 *
 * REDISEÑO — dos correcciones sobre la primera reconstrucción:
 *
 * 1) El eyebrow decía "Real results" / "Resultados reales" encima de una
 *    lista de beneficios y dos botones de tienda — ningún antes/después, sin
 *    testimonio. Prometía una prueba que la sección no entrega. Se cambia a
 *    "What to expect" / "Lo que puedes esperar": describe honestamente lo que
 *    SÍ hay (una lista de beneficios), no lo que falta.
 * 2) Las imágenes ilustrativas nuevas llegan compuestas como comparativas.
 *    Para no insinuar resultados garantizados se usa únicamente su mitad
 *    editorial en la pieza protagonista. La segunda composición solicitada
 *    se conserva completa en un panel panorámico y se rotula expresamente
 *    como imagen ilustrativa, sin añadir afirmaciones de resultados.
 */
export function CampaignFlyers({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" padding="compact" labelledBy="campaign-flyers-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <Reveal>
            <div className="campaign-editorial-feature">
              <figure>
                <EditorialImage
                  src="/images/gaviota/products/exfoliante-coco-editorial-feature-v2.webp"
                  alt={pick(locale, 'Man beside Gaviota by Lia Coconut Body Scrub in a warm pink body-care scene', 'Hombre junto al Exfoliante de Coco Gaviota by Lia en una escena de cuidado corporal rosa cálido')}
                  width={1086}
                  height={1448}
                  sizes="(max-width: 1023px) calc(100vw - 2.5rem), 34rem"
                  focal="50% 50%"
                  fit="contain"
                />
              </figure>
              <p>{pick(locale, 'Illustrative image', 'Imagen ilustrativa')}</p>
            </div>
          </Reveal>

          <Reveal className="min-w-0 lg:py-6">
            <SectionHeader
              id="campaign-flyers-title"
              eyebrow={pick(locale, 'What to expect', 'Lo que puedes esperar')}
              title={pick(locale, 'Your daily moment of care.', 'Tu momento diario de cuidado.')}
              subtitle={pick(
                locale,
                'A simple body-care ritual made to hydrate, soften, and turn every application into a moment of your own.',
                'Un ritual sencillo de cuidado corporal creado para hidratar, suavizar y convertir cada aplicación en un momento para ti.',
              )}
              align="left"
              className="mb-8 sm:mb-9"
            />

            <ul className="space-y-5">
              {CAMPAIGN_BENEFITS.map((benefit) => (
                <li key={benefit.title.en} className="flex gap-3.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-powder/55 text-wine">
                    <Check className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{t(benefit.title, locale)}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-body">{t(benefit.body, locale)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton href={localizedHref(locale, '/shop')} variant="wine">
                {pick(locale, 'Shop the collection', 'Ver la colección')}
              </LinkButton>
            </div>
          </Reveal>
        </div>

        <Reveal className="campaign-editorial-wide-wrap">
          <figure className="campaign-editorial-wide">
            <EditorialImage
              src="/images/gaviota/products/exfoliante-coco-editorial-mujer-full.webp"
              alt={pick(
                locale,
                'Illustrative side-by-side body-care scene with a woman and Gaviota by Lia Coconut Body Scrub',
                'Escena ilustrativa de cuidado corporal en paralelo con una mujer y el Exfoliante de Coco Gaviota by Lia',
              )}
              width={1440}
              height={960}
              sizes="(max-width: 1023px) calc(100vw - 2.5rem), 56rem"
              focal="50% 50%"
              fit="contain"
            />
          </figure>
          <p>{pick(locale, 'Illustrative image', 'Imagen ilustrativa')}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
