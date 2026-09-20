import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';

import { Hero } from '@/components/sections/hero';
import { TrustStrip } from '@/components/sections/trust-strip';
import { Benefits } from '@/components/sections/benefits';
import { Collection } from '@/components/sections/collection';
import { BuildRitual } from '@/components/sections/build-ritual';
import { Campaign } from '@/components/sections/campaign';
import { CampaignFlyers } from '@/components/sections/campaign-flyers';
import { RitualSteps } from '@/components/sections/ritual-steps';
import { Ingredients } from '@/components/sections/ingredients';
import { Founder } from '@/components/sections/founder';
import { BeforeAfter } from '@/components/sections/before-after';
import { Community } from '@/components/sections/community';
import { Sets } from '@/components/sections/sets';
import { Faq } from '@/components/sections/faq';
import { Newsletter } from '@/components/sections/newsletter';
import { HomeReviews } from '@/components/sections/home-reviews';

/**
 * Home.
 *
 * Todas las secciones son Server Components asíncronos. Lo único que llega al
 * bundle de cliente es el header (scroll, drawer, contador), el `Reveal` y los
 * botones de la tarjeta de producto.
 *
 * Los productos y los kits encabezan la página; la parte editorial y la ayuda
 * vienen después (auditoría del 2026-09-20: el kit quedaba a nueve secciones
 * de los productos que lo componen).
 *
 * RITMO VISUAL — alternancia de temperatura. Es la regla que sostiene la
 * dirección editorial: la página nunca repite superficie en dos secciones
 * consecutivas. Leído de arriba abajo:
 *
 *   Hero .............. marfil
 *   Franja confianza .. rosa empolvado
 *   Beneficios ........ blanco
 *   Colección ......... crema rosado (`blush`, más claro que `powder` — ver
 *                       comentario de `TONES` en layout-primitives.tsx)
 *   Sets .............. rosa empolvado
 *   Build your ritual . marfil
 *   Campaña ........... vino          ← a sangre, sin padding
 *   Flyers campaña .... marfil
 *   Ritual 3 pasos .... blanco
 *   Ingredientes ...... marfil
 *   Fundadora ......... blanco
 *   Antes/después ..... rosa empolvado  ← oculta, ver abajo
 *   Comunidad ......... espresso
 *   Reseñas ........... blanco           ← solo con reseñas aprobadas
 *   FAQ ............... blanco
 *   Newsletter ........ marfil
 *   Footer ............ marfil
 *
 * `Collection` (blush) y `Sets` (powder) quedan ahora contiguas: son dos rosas
 * distintos, no la misma superficie repetida, pero es la transición más suave
 * de la página. Es el precio de acercar el kit a los productos que lo forman.
 *
 * Secciones que existen en el sistema de contenido pero NO se renderizan
 * porque están en `draft`: `home.ugc`, `home.instagram`, `home.beforeAfter`.
 * `getSection()` devuelve null y el componente no pinta nada. `BeforeAfter`
 * tiene además un candado propio (un array de contenido vacío a propósito, ver
 * `src/lib/content/before-after-items.ts`) — se activa sola cuando exista
 * fotografía real y consentida, nunca antes.
 *
 * `home.faq` SÍ está activa desde la auditoría del 2026-09-20: sus respuestas
 * ya no se inventan, salen de la misma fuente que `/faq` (ver `faq-items.ts`).
 */
export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <Hero locale={lang} />
      <TrustStrip locale={lang} />
      <Benefits locale={lang} />
      <Collection locale={lang} />
      <Sets locale={lang} />
      <BuildRitual locale={lang} />
      <Campaign locale={lang} />
      <CampaignFlyers locale={lang} />
      <RitualSteps locale={lang} />
      <Ingredients locale={lang} />
      <Founder locale={lang} />
      <BeforeAfter locale={lang} />
      <Community locale={lang} />
      <HomeReviews locale={lang} />
      <Faq locale={lang} />
      <Newsletter locale={lang} />
    </>
  );
}
