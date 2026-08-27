import { EditorialImage } from '@/components/media/site-image';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { getBeforeAfterItems } from '@/lib/content/before-after-items';
import { getSection } from '@/lib/content/sections';
import { pick, type Locale } from '@/lib/i18n';

/**
 * Comparativas "antes/después" — oculta hasta que exista fotografía real y
 * consentida. Ver `src/lib/content/before-after-items.ts`: el array de pares
 * vive vacío a propósito, y esto devuelve `null` mientras lo esté, sin
 * importar el `status` de la sección. Doble candado deliberado: ni activar
 * la sección sin fotos, ni cargar fotos sin activar la sección, dejan esto
 * visible por accidente.
 *
 * Cuando haya contenido real, cada par debe llevar el mismo encuadre e
 * iluminación en ambas tomas y el aviso "los resultados pueden variar" se
 * queda siempre visible — no es opcional.
 */
export async function BeforeAfter({ locale }: { locale: Locale }) {
  const c = await getSection('home.beforeAfter', locale);
  const items = getBeforeAfterItems(locale);
  if (!c || items.length === 0) return null;

  const before = pick(locale, 'Before', 'Antes');
  const after = pick(locale, 'After', 'Después');

  return (
    <Section tone="powder" labelledBy="before-after-title">
      <Container size="wide">
        <SectionHeader
          id="before-after-title"
          eyebrow={c.eyebrow}
          title={c.title ?? ''}
          subtitle={c.subtitle}
          tone="powder"
        />

        <Reveal>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <li key={item.beforeImage}>
                <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-sm">
                  <figure className="relative aspect-square">
                    <EditorialImage
                      src={item.beforeImage}
                      alt={pick(locale, `${item.alt.en} — before`, `${item.alt.es} — antes`)}
                      width={800}
                      height={800}
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 25vw, 17vw"
                      focal="50% 50%"
                    />
                    <figcaption className="absolute left-2 top-2 rounded-pill bg-wine/85 px-2 py-1 text-2xs font-semibold uppercase tracking-[0.1em] text-on-dark">
                      {before}
                    </figcaption>
                  </figure>
                  <figure className="relative aspect-square">
                    <EditorialImage
                      src={item.afterImage}
                      alt={pick(locale, `${item.alt.en} — after`, `${item.alt.es} — después`)}
                      width={800}
                      height={800}
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 25vw, 17vw"
                      focal="50% 50%"
                    />
                    <figcaption className="absolute left-2 top-2 rounded-pill bg-wine/85 px-2 py-1 text-2xs font-semibold uppercase tracking-[0.1em] text-on-dark">
                      {after}
                    </figcaption>
                  </figure>
                </div>
                <p className="sr-only">{`${pick(locale, 'Comparison', 'Comparativa')} ${index + 1}`}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-body">
          {pick(
            locale,
            'These images illustrate a real care ritual. Individual experience and appearance may vary.',
            'Estas imágenes ilustran un ritual de cuidado real. La experiencia y apariencia individual pueden variar.',
          )}
        </p>
      </Container>
    </Section>
  );
}
