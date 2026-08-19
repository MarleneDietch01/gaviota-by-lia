import { EditorialImage } from '@/components/media/site-image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { RITUAL_STEPS, t } from '@/lib/content/home-data';
import { getSection } from '@/lib/content/sections';
import { localizedHref, type Locale } from '@/lib/i18n';

/**
 * Ritual en tres pasos: exfoliar, hidratar, tratar.
 *
 * `<ol>` y no `<ul>`: el orden importa, y un lector de pantalla debe anunciarlo
 * como secuencia numerada.
 *
 * `frame-arch` sí se ve ahora. Antes se combinaba con `rounded-card` en el
 * mismo elemento y esta última ganaba en el CSS compilado, dejando las cuatro
 * esquinas a 4px: el gesto de marca estaba muerto en toda la web. La utilidad
 * declara ahora las cuatro esquinas y no depende del orden.
 */
export async function RitualSteps({ locale }: { locale: Locale }) {
  const c = await getSection('home.ritual', locale);
  if (!c) return null;

  return (
    <Section tone="white" labelledBy="ritual-title">
      <Container>
        <SectionHeader
          id="ritual-title"
          eyebrow={c.eyebrow}
          title={c.title ?? ''}
          subtitle={c.subtitle}
        />

        <ol className="grid gap-12 sm:gap-10 lg:grid-cols-3 lg:gap-8">
          {RITUAL_STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 90} className="relative">
              {/* Numeración editorial de fondo. Decorativa: no aporta
                  información, la lista ya es ordenada. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-7 left-0 z-0 font-display text-[6.5rem] leading-none text-powder/45 lg:text-[7.5rem]"
              >
                {step.n}
              </span>

              <div className="relative z-10">
                <div className="frame-arch">
                  <div className="aspect-[4/5]">
                    <EditorialImage
                      src={step.image}
                      alt={t(step.alt, locale)}
                      width={1600}
                      height={2000}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 31vw"
                      focal={step.focal}
                    />
                  </div>
                </div>

                <h3 className="mt-6 font-display text-h3">{t(step.verb, locale)}</h3>

                <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">
                  {t(step.body, locale)}
                </p>

                <Link
                  href={localizedHref(locale, step.href)}
                  className="group mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rose transition-colors hover:text-rose-deep"
                >
                  {t(step.product, locale)}
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 ease-editorial motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
