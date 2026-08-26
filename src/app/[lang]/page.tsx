import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';

import { Hero } from '@/components/sections/hero';
import { Benefits } from '@/components/sections/benefits';
import { Collection } from '@/components/sections/collection';
import { BuildRitual } from '@/components/sections/build-ritual';
import { Campaign } from '@/components/sections/campaign';
import { CampaignFlyers } from '@/components/sections/campaign-flyers';
import { RitualSteps } from '@/components/sections/ritual-steps';
import { Ingredients } from '@/components/sections/ingredients';
import { Founder } from '@/components/sections/founder';
import { Community } from '@/components/sections/community';
import { Sets } from '@/components/sections/sets';
import { Newsletter } from '@/components/sections/newsletter';

/**
 * Home.
 *
 * Todas las secciones son Server Components asíncronos. Lo único que llega al
 * bundle de cliente es el header (scroll, drawer, contador), el `Reveal` y los
 * botones de la tarjeta de producto.
 *
 * RITMO VISUAL — alternancia de temperatura. Es la regla que sostiene la
 * dirección editorial: la página nunca repite superficie en dos secciones
 * consecutivas. Leído de arriba abajo:
 *
 *   Hero .............. marfil
 *   Beneficios ........ blanco
 *   Colección ......... rosa empolvado
 *   Build your ritual . marfil
 *   Campaña ........... vino          ← a sangre, sin padding
 *   Flyers campaña .... marfil
 *   Ritual 3 pasos .... blanco
 *   Ingredientes ...... marfil
 *   Fundadora ......... blanco
 *   Comunidad ......... vino
 *   Sets .............. rosa empolvado
 *   Newsletter ........ marfil
 *   Footer ............ vino
 *
 * Secciones que existen en el sistema de contenido pero NO se renderizan porque
 * están en `draft`: `home.testimonials`, `home.ugc`, `home.instagram`.
 * `getSection()` devuelve null y el componente no pinta nada. Se activarán
 * solas cuando existan reseñas verificadas y material autorizado.
 */
export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <Hero locale={lang} />
      <Benefits locale={lang} />
      <Collection locale={lang} />
      <BuildRitual locale={lang} />
      <Campaign locale={lang} />
      <CampaignFlyers locale={lang} />
      <RitualSteps locale={lang} />
      <Ingredients locale={lang} />
      <Founder locale={lang} />
      <Community locale={lang} />
      <Sets locale={lang} />
      <Newsletter locale={lang} />
    </>
  );
}
