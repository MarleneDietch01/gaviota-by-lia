import { Check } from 'lucide-react';
import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { CAMPAIGN_BENEFITS, t } from '@/lib/content/home-data';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * Franja de beneficios de campaña.
 *
 * Antes eran dos imágenes de flyer (rosa/azul) con todo el texto incrustado en
 * el píxel: no traducía a /en, no era accesible ni indexable por buscadores, y
 * llevaban un QR, un WhatsApp y un dominio propio que no corresponden a ningún
 * canal verificado del sitio actual. Reconstruida con maquetación real —
 * bullets como texto (`CAMPAIGN_BENEFITS`, en `home-data.ts`).
 *
 * Las fotos de antes/después y los claims de aclarado de piel / crecimiento de
 * barba que llevaban los flyers originales NO se republican: quedan anotados
 * como bloqueados por aprobación en `docs/LEGAL_TODO.md` (L13), con el mismo
 * criterio que L8. Los archivos originales siguen en `editorial/` por si hace
 * falta recuperar algo puntual, pero ya no los referencia ningún componente.
 *
 * REDISEÑO — dos correcciones sobre la primera reconstrucción:
 *
 * 1) El eyebrow decía "Real results" / "Resultados reales" encima de una
 *    lista de beneficios y dos botones de tienda — ningún antes/después, sin
 *    testimonio. Prometía una prueba que la sección no entrega. Se cambia a
 *    "What to expect" / "Lo que puedes esperar": describe honestamente lo que
 *    SÍ hay (una lista de beneficios), no lo que falta.
 * 2) La pareja de fotos combinaba una foto de estilo de vida sobre rosa con un
 *    packshot del tónico de barba sobre blanco en la misma fila — fondos,
 *    iluminación y escala distintos, y un producto masculino conviviendo con
 *    una escena de cuidado corporal femenino en el mismo módulo. Queda una
 *    sola foto (recorte limpio de la sesión, ver comentario en el JSX de
 *    abajo); "Ver cuidado masculino" ya vive en la navegación principal y en
 *    el footer, así que retirarlo de aquí no reduce su visibilidad en el
 *    sitio. La línea masculina merece su propio bloque dedicado más adelante,
 *    no compartir fila con esto — no se construye en este pase por alcance.
 */
export function CampaignFlyers({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" labelledBy="campaign-flyers-title">
      <Container>
        <SectionHeader
          id="campaign-flyers-title"
          eyebrow={pick(locale, 'What to expect', 'Lo que puedes esperar')}
          title={pick(locale, 'Your best version starts here.', 'Tu mejor versión empieza aquí.')}
        />

        <Reveal>
          <ul className="mx-auto mb-14 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3">
            {CAMPAIGN_BENEFITS.map((benefit) => (
              <li key={benefit.en} className="flex items-center gap-2 text-sm font-medium text-body">
                <Check className="size-4 shrink-0 text-rose" strokeWidth={2.5} aria-hidden="true" />
                {t(benefit, locale)}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mx-auto max-w-md">
          {/*
            Recorte propio de la foto de sesión (`journal-tras-camaras-cropped.jpg`,
            generado desde el original en `originales/LeslieEstevezPhotographyGA15.jpg`),
            no la versión publicada anteriormente: esa mostraba el borde del papel de
            fondo, el piso y el estante de telones enrollados en el margen — una toma
            de detrás de cámaras, no una foto terminada. El recorte deja solo el fondo
            rosa limpio y a las dos modelos, sin tocar facciones, cuerpos ni color.
          */}
          <figure className="aspect-[4/5] overflow-hidden rounded-sm bg-powder/20">
            <EditorialImage
              src="/images/gaviota/editorial/journal-tras-camaras-cropped.jpg"
              alt={pick(
                locale,
                'Gaviota by Lia product being applied to skin during a photoshoot',
                'Producto Gaviota by Lia aplicándose sobre la piel durante una sesión de fotos',
              )}
              width={1600}
              height={1923}
              sizes="(max-width: 639px) 100vw, 28rem"
              focal="50% 42%"
            />
          </figure>
          <div className="mt-5 text-center">
            <LinkButton href={localizedHref(locale, '/shop')} variant="secondary">
              {pick(locale, 'Shop the collection', 'Ver la colección')}
            </LinkButton>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
