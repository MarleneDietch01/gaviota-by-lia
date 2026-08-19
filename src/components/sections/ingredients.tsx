import { EditorialImage } from '@/components/media/site-image';
import { Clock } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { INGREDIENTS, SHOW_PLACEHOLDERS, t } from '@/lib/content/home-data';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Ingredientes destacados.
 *
 * -----------------------------------------------------------------------------
 * LÍMITE DE CONTENIDO, EXPLÍCITO
 *
 * Solo el coco está confirmado: figura impreso en la etiqueta del Exfoliante de
 * Coco. Los otros dos son CATEGORÍAS sensoriales, no principios activos, y
 * están redactados sin nombrar INCI ni prometer resultado alguno.
 *
 * La lista completa de ingredientes sigue pendiente (CONTENT_TODO.md C1). Hasta
 * que llegue, los no verificados llevan una marca visible; el interruptor está
 * en `SHOW_PLACEHOLDERS`. No se inventa ni un ingrediente ni un porcentaje.
 * -----------------------------------------------------------------------------
 */
export async function Ingredients({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" labelledBy="ingredients-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <Reveal className="frame-arch order-1 lg:order-2">
            <div className="aspect-[4/5] lg:aspect-[4/5]">
              <EditorialImage
                src="/images/gaviota/editorial/coleccion-completa.jpg"
                alt={pick(
                  locale,
                  'The complete Gaviota by Lia product line arranged together',
                  'La línea completa de productos Gaviota by Lia dispuesta en conjunto',
                )}
                width={2000}
                height={2500}
                sizes="(min-width: 1024px) 46vw, 100vw"
                focal="50% 45%"
              />
            </div>
          </Reveal>

          <Reveal className="order-2 lg:order-1">
            <p className="eyebrow mb-4 text-rose">
              {pick(locale, 'Ingredients', 'Ingredientes')}
            </p>

            <h2 id="ingredients-title" className="text-h2">
              {pick(locale, 'What goes ', 'Lo que llevan ')}
              <span className="accent-word">{pick(locale, 'inside', 'dentro')}</span>.
            </h2>

            <Rule className="my-7 max-w-24" />

            <dl className="space-y-7">
              {INGREDIENTS.map((ingredient) => (
                <div key={ingredient.key}>
                  <dt className="flex flex-wrap items-center gap-2 font-sans text-[0.9375rem] font-semibold tracking-[-0.01em]">
                    {t(ingredient.name, locale)}
                    {!ingredient.verified && SHOW_PLACEHOLDERS ? (
                      // Borde discontinuo, no sólido: el mismo lenguaje "en
                      // curso" que la caja de reseñas de `community.tsx`, para
                      // que se lea como estado pendiente y no como un tag de
                      // filtro o un error de maquetación.
                      <span className="inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted">
                        <Clock className="size-2.5" strokeWidth={2} aria-hidden="true" />
                        {pick(locale, 'Pending detail', 'Pendiente de detalle')}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-body">
                    {t(ingredient.body, locale)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 text-sm leading-relaxed text-muted">
              {pick(
                locale,
                'The full ingredient list for each product is printed on its label and will be published here in full.',
                'La lista completa de ingredientes de cada producto está impresa en su etiqueta y se publicará aquí íntegra.',
              )}
            </p>

            <div className="mt-8">
              <LinkButton
                href={localizedHref(locale, '/ingredients')}
                variant="secondary"
                size="lg"
              >
                {pick(locale, 'See all ingredients', 'Ver todos los ingredientes')}
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
