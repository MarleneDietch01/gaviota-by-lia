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
 * 2) La pareja de fotos combinaba una foto de estilo de vida sobre rosa con un
 *    packshot del tónico de barba sobre blanco en la misma fila — fondos,
 *    iluminación y escala distintos, y un producto masculino conviviendo con
 *    una escena de cuidado corporal femenino en el mismo módulo. Queda una
 *    sola foto (recorte limpio de la sesión, ver comentario en el JSX de
 *    abajo); "Ver cuidado masculino" ya vive en la navegación principal y en
 *    el footer, así que retirarlo de aquí no reduce su visibilidad en el
 *    sitio. La línea masculina merece su propio bloque dedicado más adelante,
 *    no compartir fila con esto — no se construye en este pase por alcance.
 */
export function CampaignFlyers({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" padding="compact" labelledBy="campaign-flyers-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <Reveal>
            {/* Proporción nativa 4:5: no añade recortes a rostro, manos, piernas o tarro. */}
            <figure className="aspect-[4/5] overflow-hidden rounded-sm bg-powder/20">
              <EditorialImage
                src="/images/gaviota/editorial/ritual-exfolia.jpg"
                alt={pick(
                  locale,
                  'Woman applying a Gaviota by Lia body care product to her leg while holding the jar',
                  'Mujer aplicando un producto corporal Gaviota by Lia en su pierna mientras sostiene el tarro',
                )}
                width={1600}
                height={2000}
                sizes="(max-width: 1023px) calc(100vw - 2.5rem), 34rem"
                focal="50% 50%"
              />
            </figure>
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
      </Container>
    </Section>
  );
}
