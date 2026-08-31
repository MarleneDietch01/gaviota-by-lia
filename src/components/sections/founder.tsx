import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { getSection } from '@/lib/content/sections';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Historia de marca y fundadora.
 *
 * NO se explica quién es "Lia": el sitio actual nunca lo ha dicho y no se
 * inventará una relación familiar ni una historia ficticia (CONTENT_TODO.md
 * C10). El texto queda preparado para incorporar la respuesta cuando llegue.
 */
export async function Founder({ locale }: { locale: Locale }) {
  const c = await getSection('home.story', locale);
  if (!c) return null;

  return (
    <Section tone="white" padding="compact" labelledBy="story-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-20">
          <Reveal className="founder-portrait relative">
            <div className="frame-arch">
              <div className="aspect-[4/5]">
                <EditorialImage
                  src="/images/gaviota/editorial/story-fundadora.jpg"
                  alt={pick(
                    locale,
                    'Portrait of Marlene Dietsch, founder of Gaviota by Lia',
                    'Retrato de Marlene Dietsch, fundadora de Gaviota by Lia',
                  )}
                  width={1800}
                  height={2250}
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  focal="50% 28%"
                />
              </div>
            </div>

            {/* Segunda foto en offset: solo desde `lg`, donde el grid le deja
                aire en el gap para no desbordar el Container. En columna
                única (< lg) una sola foto ya se lee completa; una segunda
                superpuesta ahí se recortaría contra el borde. */}
            <div className="absolute -bottom-10 -right-8 hidden w-[48%] lg:block xl:-right-12">
              <div className="overflow-hidden rounded-sm shadow-lift ring-8 ring-white-warm">
                <div className="aspect-[3/4]">
                  <EditorialImage
                    src="/images/gaviota/founder/fundadora-1.jpg"
                    alt={pick(
                      locale,
                      'Marlene Dietsch, founder of Gaviota by Lia',
                      'Marlene Dietsch, fundadora de Gaviota by Lia',
                    )}
                    width={1600}
                    height={2000}
                    sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 18vw, 45vw"
                    focal="50% 20%"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Sin `max-w` fijo desde `lg`: el track de texto mide ~1.1fr del
              grid (≈660px dentro del Container de 1200px). Un `max-w-[34rem]`
              (544px) fijo dejaba una franja vacía a la derecha del párrafo en
              pantallas anchas — el bloque se leía más plano de lo que es. */}
          <Reveal delay={80} className="max-w-[30rem] lg:max-w-none">
            {c.eyebrow ? <p className="eyebrow mb-4 text-rose">{c.eyebrow}</p> : null}

            <h2 id="story-title" className="text-h2">
              {pick(locale, 'Dominican beauty, made into ', 'Belleza dominicana hecha ')}
              <span className="accent-word">ritual</span>.
            </h2>

            <Rule className="my-7 max-w-24" />

            {c.body ? (
              <p className="text-lead leading-relaxed text-body">{c.body}</p>
            ) : null}

            {/* NO se pone aquí una cita entrecomillada atribuida a la
                fundadora. El texto aprobado de `sections.ts` describe su
                intención, pero convertirlo en declaración literal sería
                atribuir a una persona real unas palabras que no consta que
                dijera. Cuando exista una cita autorizada, este es su sitio. */}

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Marlene Dietsch — {pick(locale, 'Founder', 'Fundadora')}
            </p>

            {c.buttonLabel && c.buttonUrl ? (
              <div className="mt-9">
                <LinkButton
                  href={localizedHref(locale, c.buttonUrl)}
                  variant="secondary"
                  size="lg"
                >
                  {c.buttonLabel}
                </LinkButton>
              </div>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
