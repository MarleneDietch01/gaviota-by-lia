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
 *
 * SIN IMAGEN A PROPÓSITO: con un solo ingrediente confirmado, una foto a toda
 * altura junto al texto dejaba un vacío enorme (la columna de texto es mucho
 * más corta que la imagen). El banco de fotografía disponible tampoco tenía
 * ninguna que no estuviera ya en uso en otro punto de la home sin repetirse
 * (ver home-data.ts: `coleccion-completa.jpg` vivía aquí Y en `RITUAL_NEEDS`).
 * Franja compacta de una sola columna en vez de forzar una imagen repetida o
 * un hueco.
 * -----------------------------------------------------------------------------
 */
export async function Ingredients({ locale }: { locale: Locale }) {
  const verifiedIngredients = INGREDIENTS.filter((ingredient) => ingredient.verified);
  if (!verifiedIngredients.length) return null;

  return (
    <Section tone="ivory" labelledBy="ingredients-title">
      <Container size="narrow">
        <Reveal className="text-center">
          <p className="eyebrow mb-4 text-rose">
            {pick(locale, 'Ingredients', 'Ingredientes')}
          </p>

          <h2 id="ingredients-title" className="text-h2">
            {pick(locale, 'What goes ', 'Lo que llevan ')}
            <span className="accent-word">{pick(locale, 'inside', 'dentro')}</span>.
          </h2>

          <Rule className="mx-auto my-7 max-w-24" />

          <dl className="mx-auto flex max-w-md flex-col items-center gap-1.5">
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

          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
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
      </Container>
    </Section>
  );
}
