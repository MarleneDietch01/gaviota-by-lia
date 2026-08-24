import { EditorialImage } from '@/components/media/site-image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { RITUAL_NEEDS, t } from '@/lib/content/home-data';
import { localizedHref, type Locale } from '@/lib/i18n';

/**
 * "Build your ritual" — entrada editorial al catálogo por necesidad.
 *
 * Rejilla asimétrica: la primera opción ocupa el doble de ancho y hace de
 * portada de la sección. Con cinco tarjetas iguales en cinco columnas el bloque
 * se leía como una fila de iconos de plantilla; con una destacada, se lee como
 * una portada de revista.
 *
 * Eso resuelve además el huérfano: cinco elementos en dos columnas dejaban uno
 * suelto a media fila. Aquí 1 grande + 4 pequeñas cuadran en cualquier número
 * de columnas.
 *
 * Son enlaces normales: funciona sin JavaScript y sin animación.
 */
export async function BuildRitual({ locale }: { locale: Locale }) {
  const first = RITUAL_NEEDS[0];
  const rest = RITUAL_NEEDS.slice(1);
  if (!first) return null;

  return (
    <Section tone="ivory" labelledBy="ritual-needs-title">
      <Container>
        <SectionHeader
          id="ritual-needs-title"
          eyebrow={locale === 'es' ? 'Encuentra tu ritual' : 'Find your ritual'}
          title={
            locale === 'es' ? (
              <>
                ¿Qué quieres <span className="accent-word">cuidar</span> hoy?
              </>
            ) : (
              <>
                What does your skin <span className="accent-word">need</span> today?
              </>
            )
          }
          subtitle={
            locale === 'es'
              ? 'Cada piel es distinta. Empieza por lo que hoy te apetece cuidar.'
              : 'Every skin is different. Start with what you want to care for today.'
          }
        />

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <NeedCard need={first} locale={locale} feature />
          </Reveal>

          {rest.map((need, i) => (
            <Reveal key={need.href} delay={(i + 1) * 60}>
              <NeedCard need={need} locale={locale} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function NeedCard({
  need,
  locale,
  feature = false,
}: {
  need: (typeof RITUAL_NEEDS)[number];
  locale: Locale;
  feature?: boolean;
}) {
  return (
    <Link
      href={localizedHref(locale, need.href)}
      className="group flex h-full flex-col overflow-hidden rounded-sm bg-white-warm transition-shadow duration-500 ease-soft hover:shadow-lift"
    >
      {/* Cuadrado, no 4:3, en las cinco tarjetas: los packshots de estudio son
          lienzos cuadrados de 1200 px (ver `docs/IMAGE_USAGE.md` §5), así que
          en un contenedor cuadrado `fit="contain"` y `fit="cover"` producen el
          MISMO resultado — llenan el marco sin dejar el margen blanco que
          delataba cuál tarjeta era un packshot y cuál una foto de estilo de
          vida. Antes, con 4:3, esa diferencia de tratamiento era la única
          anatomía distinta entre tarjetas; ahora la única diferencia real es
          el tamaño de la destacada, que crece por el `col-span`/`row-span` de
          la rejilla, no por tener un recorte de imagen distinto. */}
      <div
        className={
          feature ? 'aspect-square lg:aspect-auto lg:min-h-0 lg:flex-1' : 'aspect-square'
        }
      >
        <EditorialImage
          src={need.image}
          alt={t(need.alt, locale)}
          width={1600}
          height={2000}
          sizes={
            feature
              ? '(max-width: 1023px) 100vw, 48vw'
              : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 24vw'
          }
          focal={need.focal}
          fit={need.fit ?? 'cover'}
          className="transition-transform duration-700 ease-editorial motion-safe:group-hover:scale-[1.02]"
        />
      </div>

      {/* En la tarjeta destacada el bloque de texto NO lleva `flex-1`.
          Cuando lo llevaba, imagen y texto se repartían el espacio sobrante al
          50 % cada uno: con tres líneas de texto en una tarjeta que abarca dos
          filas de rejilla, eso dejaba ~350px de marfil vacío debajo del enlace,
          y el bloque se leía como contenido que falta. Sin `flex-1` en el texto,
          todo el sobrante se lo lleva la fotografía, que es lo que debe crecer. */}
      <div className={feature ? 'flex flex-col p-6 lg:p-8' : 'flex flex-1 flex-col p-5'}>
        <h3
          className={
            feature
              ? 'font-display text-h3 tracking-normal'
              : 'font-sans text-[0.9375rem] font-semibold tracking-[-0.01em]'
          }
        >
          {t(need.title, locale)}
        </h3>
        <p className="mt-1.5 text-sm leading-snug text-body">{t(need.body, locale)}</p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-rose">
          {locale === 'es' ? 'Ver' : 'Explore'}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 ease-editorial motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
