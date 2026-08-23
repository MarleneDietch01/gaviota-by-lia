import { Check } from 'lucide-react';
import { EditorialImage } from '@/components/media/site-image';
import { LinkButton } from '@/components/ui/button';
import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { CAMPAIGN_BENEFITS, t } from '@/lib/content/home-data';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/**
 * "Resultados reales" — franja de beneficios de campaña.
 *
 * Antes eran dos imágenes de flyer (rosa/azul) con todo el texto incrustado en
 * el píxel: no traducía a /en, no era accesible ni indexable por buscadores, y
 * llevaban un QR, un WhatsApp y un dominio propio que no corresponden a ningún
 * canal verificado del sitio actual. Reconstruida con maquetación real —
 * bullets como texto (`CAMPAIGN_BENEFITS`, en `home-data.ts`) y fotografía de
 * producto real del mismo banco que el resto del sitio.
 *
 * Las fotos de antes/después y los claims de aclarado de piel / crecimiento de
 * barba que llevaban los flyers originales NO se republican: quedan anotados
 * como bloqueados por aprobación en `docs/LEGAL_TODO.md` (L13), con el mismo
 * criterio que L8. Los archivos originales siguen en `editorial/` por si hace
 * falta recuperar algo puntual, pero ya no los referencia ningún componente.
 */
export function CampaignFlyers({ locale }: { locale: Locale }) {
  return (
    <Section tone="ivory" labelledBy="campaign-flyers-title">
      <Container>
        <SectionHeader
          id="campaign-flyers-title"
          eyebrow={pick(locale, 'Real results', 'Resultados reales')}
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

        <div className="grid gap-8 sm:grid-cols-2">
          <Reveal>
            <figure className="aspect-square overflow-hidden rounded-sm bg-powder/20">
              <EditorialImage
                src="/images/gaviota/editorial/journal-tras-camaras.jpg"
                alt={pick(
                  locale,
                  'Gaviota by Lia product being applied to skin during a photoshoot',
                  'Producto Gaviota by Lia aplicándose sobre la piel durante una sesión de fotos',
                )}
                width={1600}
                height={2000}
                sizes="(max-width: 639px) 100vw, 50vw"
                focal="62% 60%"
              />
            </figure>
            <div className="mt-5 text-center">
              <LinkButton href={localizedHref(locale, '/shop')} variant="secondary">
                {pick(locale, 'Shop the collection', 'Ver la colección')}
              </LinkButton>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <figure className="aspect-square overflow-hidden rounded-sm bg-champagne/20">
              <EditorialImage
                src="/images/gaviota/products/tonico-para-barba-studio.jpg"
                alt={pick(
                  locale,
                  'Gaviota by Lia Beard Tonic bottle',
                  'Frasco del Tónico Para Barba Gaviota by Lia',
                )}
                width={1200}
                height={1200}
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
