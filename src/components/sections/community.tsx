import { EditorialImage } from '@/components/media/site-image';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { COMMUNITY_PHOTOS, PLACEHOLDER_NOTE, SHOW_PLACEHOLDERS, t } from '@/lib/content/home-data';
import { getSection } from '@/lib/content/sections';
import { pick, type Locale } from '@/lib/i18n';

/**
 * Comunidad — galería visual + hueco de reseñas.
 *
 * -----------------------------------------------------------------------------
 * SOBRE LOS TESTIMONIOS
 *
 * El sitio no tiene NI UNA reseña. El brief pide construir la sección y, donde
 * no haya contenido real, dejar "textos claramente marcados como placeholder".
 *
 * Lo que se hace: se construye la sección y se declara EXPLÍCITAMENTE que está
 * a la espera de reseñas verificadas.
 *
 * Lo que NO se hace, en ningún caso: escribir testimonios de ejemplo con nombre
 * y valoración. Un testimonio verosímil acaba publicándose por error, y publicar
 * reseñas inventadas es motivo de penalización manual de Google además de un
 * problema legal.
 *
 * Interruptor: `SHOW_PLACEHOLDERS` en `lib/content/home-data.ts`.
 * -----------------------------------------------------------------------------
 */
export async function Community({ locale }: { locale: Locale }) {
  const c = await getSection('home.community', locale);
  if (!c) return null;

  return (
    <Section tone="wine" labelledBy="community-title">
      <Container size="wide">
        <SectionHeader
          id="community-title"
          eyebrow={c.eyebrow}
          title={c.title ?? ''}
          subtitle={c.subtitle}
          tone="dark"
        />

        {/* Igual que en la colección: el Reveal envuelve el carrusel entero.
            Por tarjeta, las que quedan fuera de pantalla a la derecha nunca
            intersecan y se quedarían invisibles de forma permanente. */}
        <Reveal>
          <ul
            className={
              '-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 ' +
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
              // Difuminado del borde derecho: única pista de que el carrusel
              // sigue fuera de pantalla. Se retira en `sm`, donde ya es rejilla.
              '[mask-image:linear-gradient(to_right,black_86%,transparent)] ' +
              '[-webkit-mask-image:linear-gradient(to_right,black_86%,transparent)] ' +
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4 ' +
              'sm:[mask-image:none] sm:[-webkit-mask-image:none]'
            }
          >
            {COMMUNITY_PHOTOS.map((photo) => (
              <li
                key={photo.src}
                className="w-[68%] shrink-0 snap-start sm:w-auto sm:shrink"
              >
                <div className="community-photo overflow-hidden rounded-sm">
                  <div className="aspect-[4/5]">
                    <EditorialImage
                      src={photo.src}
                      alt={t(photo.alt, locale)}
                      width={1400}
                      height={1750}
                      sizes="(max-width: 639px) 68vw, (max-width: 1023px) 48vw, 23vw"
                      // Todos los originales son 4:5, igual que el contenedor:
                      // `object-cover` no recorta y el punto focal no tiene
                      // efecto. Se deja el centro por defecto. Si algún día se
                      // cambia el `aspect-[4/5]` de arriba, habrá que volver a
                      // pasar un focal por foto.
                      focal="50% 50%"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {SHOW_PLACEHOLDERS ? (
          <div className="mx-auto mt-14 max-w-2xl rounded-sm border border-dashed border-on-dark-soft/40 p-6 text-center sm:p-8">
            <p className="eyebrow mb-3 text-on-dark-soft">
              {pick(locale, 'Customer reviews', 'Reseñas de clientas')}
            </p>
            <p className="text-sm leading-relaxed text-on-dark-soft">
              {t(PLACEHOLDER_NOTE, locale)}
            </p>

            {/* CTA real y funcional (no un formulario de reseñas que no
                existe todavía): el canal verificado de la marca, para no
                dejar el aviso como un bloque puramente informativo. */}
            <a
              href="https://www.instagram.com/gaviotabylia/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-on-dark underline decoration-on-dark-soft/50 underline-offset-4 transition-colors hover:decoration-on-dark"
            >
              <InstagramIcon className="size-4" />
              {pick(
                locale,
                'Share your experience with us on Instagram',
                'Cuéntanos tu experiencia por Instagram',
              )}
              <span className="sr-only">
                {pick(locale, '(opens in a new tab)', '(se abre en una pestaña nueva)')}
              </span>
            </a>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
