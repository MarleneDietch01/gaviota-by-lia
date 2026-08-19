import { FillEditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { getSection } from '@/lib/content/sections';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Campaña destacada — bloque a sangre sobre vino.
 *
 * `padding="none"` es una PROP, no `className="py-0"`. La versión anterior
 * pasaba `py-0 lg:py-0` por className y perdía contra el `py-28` de la base:
 * la sección "a sangre" quedaba con 112px de banda ciruela arriba y abajo.
 * Ver el comentario de `lib/utils/cn.ts`.
 */
export async function Campaign({ locale }: { locale: Locale }) {
  const c = await getSection('home.campaign', locale);
  if (!c) return null;

  return (
    <Section tone="wine" padding="none" labelledBy="campaign-title" className="overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* La imagen llena su mitad de verdad: el contenedor se estira con la
            fila de la rejilla y la foto usa `object-cover` a altura completa. */}
        <div className="relative min-h-[22rem] sm:min-h-[26rem] lg:min-h-[42rem]">
          <FillEditorialImage
            src="/images/gaviota/editorial/campaign-aplicacion.jpg"
            alt={pick(
              locale,
              'Woman applying Gaviota by Lia body cream to her shoulder',
              'Mujer aplicando crema hidratante Gaviota by Lia sobre su hombro',
            )}
            sizes="(min-width: 1024px) 50vw, 100vw"
            focal="45% 38%"
          />
        </div>

        <div className="flex items-center px-5 py-14 sm:px-8 sm:py-20 lg:px-16 lg:py-24 xl:px-20">
          <Reveal className="max-w-[30rem]">
            {c.eyebrow ? (
              <p className="eyebrow mb-4 text-on-dark-soft">{c.eyebrow}</p>
            ) : null}

            <h2 id="campaign-title" className="text-h2 text-on-dark">
              {pick(locale, 'Softness, made into a ', 'Suavidad que se convierte en ')}
              <span className="accent-word">ritual</span>.
            </h2>

            {c.body ? (
              <p className="mt-6 text-lead leading-relaxed text-on-dark-soft">{c.body}</p>
            ) : null}

            {c.buttonLabel && c.buttonUrl ? (
              <div className="mt-9">
                <LinkButton
                  href={localizedHref(locale, c.buttonUrl)}
                  variant="onDark"
                  size="lg"
                >
                  {c.buttonLabel}
                </LinkButton>
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
