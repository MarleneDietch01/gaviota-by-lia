import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { INGREDIENTS, t } from '@/lib/content/home-data';
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
 * que llegue, los no verificados se quedan fuera del render por completo — no
 * se muestra la tarjeta con un aviso de "pendiente" a las visitantes, igual
 * que `home.testimonials`/`home.ugc` no se pintan mientras estén en `draft`.
 * No se inventa ni un ingrediente ni un porcentaje.
 * -----------------------------------------------------------------------------
 */
export async function Ingredients({ locale }: { locale: Locale }) {
  const verifiedIngredients = INGREDIENTS.filter((ingredient) => ingredient.verified);
  if (!verifiedIngredients.length) return null;

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
              {verifiedIngredients.map((ingredient) => (
                <div key={ingredient.key}>
                  <dt className="font-sans text-[0.9375rem] font-semibold tracking-[-0.01em]">
                    {t(ingredient.name, locale)}
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
