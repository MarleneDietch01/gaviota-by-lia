import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Flyers de campaña (rosa/azul).
 *
 * A diferencia de `campaign.tsx` (foto editorial recortada a `object-cover`
 * en la mitad del ancho), estas son piezas de diseño YA compuestas —
 * logotipo, titular, grid de resultados y QR en posiciones fijas — así que
 * van con `object-contain`, enteras, nunca recortadas. Decisión explícita de
 * la propietaria de publicarlas tal cual, con sus fotos de antes/después y
 * claims propios (p. ej. "Dermatologically Tested", "Underarm Brightener"):
 * quedó fuera del criterio habitual de este proyecto de no reproducir claims
 * sin verificar, porque es su decisión final sobre su propio material de
 * marketing, no una omisión.
 */
export function CampaignFlyers({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" labelledBy="campaign-flyers-title">
      <Container>
        <SectionHeader
          id="campaign-flyers-title"
          eyebrow={pick(locale, 'Real results', 'Resultados reales')}
          title={pick(locale, 'Your best version starts here', 'Tu mejor versión empieza aquí')}
        />

        <div className="grid gap-8 sm:grid-cols-2">
          <Reveal>
            <figure className="aspect-[900/1280] overflow-hidden rounded-sm bg-powder/20">
              <EditorialImage
                src="/images/gaviota/editorial/campana-flyer-mujer.jpg"
                alt={pick(
                  locale,
                  'Gaviota by Lia campaign: Coconut Body Scrub, Stretch Mark Body Oil and Hydrating Body Cream, with stretch mark and underarm before/after results',
                  'Campaña Gaviota by Lia: Exfoliante de Coco, Aceite Anti-Estrías y Crema Hidratante, con resultados de antes/después en estrías y axilas',
                )}
                width={900}
                height={1280}
                sizes="(max-width: 639px) 100vw, 50vw"
                focal="50% 50%"
                fit="contain"
              />
            </figure>
            <div className="mt-5 text-center">
              <LinkButton href={localizedHref(locale, '/shop')} variant="secondary">
                {pick(locale, 'Shop the collection', 'Ver la colección')}
              </LinkButton>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <figure className="aspect-[900/1280] overflow-hidden rounded-sm bg-champagne/20">
              <EditorialImage
                src="/images/gaviota/editorial/campana-flyer-hombre.jpg"
                alt={pick(
                  locale,
                  "Gaviota by Lia campaign: Stretch Mark Body Oil and Beard Tonic, with arm stretch mark and beard before/after results",
                  'Campaña Gaviota by Lia: Aceite Anti-Estrías y Tónico Para Barba, con resultados de antes/después en brazos y barba',
                )}
                width={900}
                height={1280}
                sizes="(max-width: 639px) 100vw, 50vw"
                focal="50% 50%"
                fit="contain"
              />
            </figure>
            <div className="mt-5 text-center">
              <LinkButton href={localizedHref(locale, '/categories/cuidado-masculino')} variant="secondary">
                {pick(locale, "Shop men's care", 'Ver cuidado masculino')}
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
