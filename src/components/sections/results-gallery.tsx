import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

const RESULTS = [
  'ChatGPT Image 26 ago 2026, 04_49_09 p.m.png',
  'ChatGPT Image 26 ago 2026, 04_50_45 p.m.png',
  'ChatGPT Image 26 ago 2026, 04_55_24 p.m. (1).png',
  'ChatGPT Image 26 ago 2026, 04_55_24 p.m. (2).png',
  'ChatGPT Image 26 ago 2026, 04_57_15 p.m.png',
] as const;

const RESULTS_PATH = '/images/gaviota/results/';

/**
 * Galería editorial conceptual.
 *
 * Los archivos proceden de imágenes generadas con IA; por eso se muestra solo
 * su lado derecho, sin construir una comparación ni sugerir un resultado de
 * producto. La atribución visible protege a la clienta de confundir estas
 * composiciones con testimonios o pruebas clínicas.
 */
export function ResultsGallery({ locale }: { locale: Locale }) {
  return (
    <Section tone="powder" labelledBy="results-title">
      <Container size="wide">
        <SectionHeader
          id="results-title"
          eyebrow={pick(locale, 'The feeling of a ritual', 'La sensación de un ritual')}
          title={
            <>
              {pick(locale, 'Care that feels ', 'Cuidado que se siente ')}
              <span className="accent-word">{pick(locale, 'like yours', 'tuyo')}</span>.
            </>
          }
          subtitle={pick(
            locale,
            'Softness, presence and a few intentional minutes for yourself.',
            'Suavidad, presencia y unos minutos intencionales para ti.',
          )}
          tone="powder"
        />

        <Reveal>
          <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {RESULTS.map((image, index) => (
              <li key={image} className="w-[84%] shrink-0 snap-start sm:w-auto sm:shrink">
                <figure className="relative aspect-[4/5] overflow-hidden rounded-sm bg-white-warm shadow-subtle">
                  <EditorialImage
                    src={`${RESULTS_PATH}${image}`}
                    alt={pick(
                      locale,
                      `Conceptual body-care visual ${index + 1}`,
                      `Visual conceptual de cuidado corporal ${index + 1}`,
                    )}
                    width={1536}
                    height={1024}
                    sizes="(max-width: 639px) 84vw, (max-width: 1023px) 46vw, 18vw"
                    focal="100% 50%"
                  />
                </figure>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-sm leading-relaxed text-body">
            {pick(
              locale,
              'Conceptual visuals created with AI for artistic inspiration. They do not depict product results or real customer experiences.',
              'Visuales conceptuales creados con IA como inspiración artística. No representan resultados de producto ni experiencias reales de clientas.',
            )}
          </p>
          <div className="mt-6">
            <LinkButton href={localizedHref(locale, '/products/exfoliante-de-coco')} variant="secondary">
              {pick(locale, 'Explore the Coconut Body Scrub', 'Conoce el Exfoliante de Coco')}
            </LinkButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
