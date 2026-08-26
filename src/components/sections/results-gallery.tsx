import { EditorialImage } from '@/components/media/site-image';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { pick, type Locale } from '@/lib/i18n';

const RESULTS = [
  'concepts/ritual-01.jpg',
  'concepts/ritual-02.jpg',
  'concepts/ritual-03.jpg',
  'concepts/ritual-04.jpg',
  'concepts/ritual-05.jpg',
] as const;

const RESULTS_PATH = '/images/gaviota/results/';

/**
 * Galería editorial conceptual.
 *
 * Cada visual se sirve en su composición vertical editorial. La nota final
 * aclara su naturaleza conceptual sin competir con la galería.
 */
export function ResultsGallery({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" padding="compact" labelledBy="results-title">
      <Container size="wide">
        <SectionHeader
          id="results-title"
          eyebrow={pick(locale, 'A moment for your skin', 'Un momento para tu piel')}
          title={
            <>
              {pick(locale, 'A ritual made ', 'Un ritual hecho ')}
              <span className="accent-word">{pick(locale, 'for you', 'para ti')}</span>.
            </>
          }
          subtitle={pick(
            locale,
            'Small gestures of care, made part of your day.',
            'Pequeños gestos de cuidado para hacer parte de tu día.',
          )}
        />

        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6">
            {RESULTS.map((image, index) => (
              <li key={image} className="first:col-span-2 sm:first:col-span-1">
                <figure className="relative aspect-[3/4] overflow-hidden rounded-sm bg-white-warm shadow-subtle">
                  <EditorialImage
                    src={`${RESULTS_PATH}${image}`}
                    alt={pick(
                      locale,
                      `Conceptual body-care visual ${index + 1}`,
                      `Visual conceptual de cuidado corporal ${index + 1}`,
                    )}
                    width={768}
                    height={1024}
                    sizes="(max-width: 639px) 50vw, (max-width: 1023px) 31vw, 19vw"
                    focal="50% 50%"
                  />
                </figure>
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="mx-auto mt-6 max-w-xl text-center text-caption leading-relaxed text-muted">
            {pick(
              locale,
              'Conceptual visuals created with AI. They do not depict product results or customer experiences.',
              'Visuales conceptuales creados con IA. No representan resultados de producto ni experiencias de clientas.',
            )}
        </p>
      </Container>
    </Section>
  );
}
