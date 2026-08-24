import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialImage } from '@/components/media/site-image';
import { NeedCard } from '@/components/sections/build-ritual';
import { LinkButton } from '@/components/ui/button';
import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { SavedList } from '@/components/commerce/saved-list';
import { getAllProducts } from '@/lib/catalog/products';
import { RITUAL_NEEDS } from '@/lib/content/home-data';
import { ROUTE_PAGES, localizedCopy, type RoutePage } from '@/lib/content/route-pages';
import { isLocale, localizedHref, pageAlternates, socialMeta, type Locale } from '@/lib/i18n';

/**
 * Botones al pie de una página de contenido.
 *
 * Ninguna página de este catch-all puede ser un callejón sin salida: si
 * `page.links` no trae nada (como `journal` o `founder`), cae a un
 * único "Volver al inicio" en vez de dejar el texto colgado sin ninguna acción.
 *
 * Pasa siempre por `LinkButton` (nunca un `<a>`/`<Link>` con clases sueltas
 * imitando el estilo primario): así ningún botón puede derivar en silencio del
 * sistema de diseño. Jerarquía consistente con el resto del sitio — solo el
 * primer enlace es `primary` (la única acción principal por pantalla), el
 * resto `secondary`.
 */
function PageLinks({ page, lang }: { page: RoutePage; lang: Locale }) {
  const links = page.links?.length ? page.links : [{ href: '/', label: { en: 'Back to home', es: 'Volver al inicio' } }];

  return (
    <div className="mt-9 flex flex-wrap gap-3">
      {links.map((item, i) =>
        item.href.startsWith('http') ? (
          <LinkButton
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            variant={i === 0 ? 'primary' : 'secondary'}
          >
            {localizedCopy(item.label, lang)}
          </LinkButton>
        ) : (
          <LinkButton
            key={item.href}
            href={localizedHref(lang, item.href)}
            variant={i === 0 ? 'primary' : 'secondary'}
          >
            {localizedCopy(item.label, lang)}
          </LinkButton>
        ),
      )}
    </div>
  );
}

type Props = PageProps<'/[lang]/[...slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const key = slug.join('/');
  const page = ROUTE_PAGES[key];
  if (!page) return {};
  const description = localizedCopy(page.body[0]!, lang);
  return {
    title: localizedCopy(page.title, lang),
    description,
    alternates: pageAlternates(lang, `/${key}`),
    ...socialMeta(lang, `/${key}`, description),
    robots:
      key === 'track-order' || key === 'cart' || key === 'wishlist'
        ? { index: false }
        : undefined,
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const key = slug.join('/');

  if (key === 'cart' || key === 'wishlist') {
    const products = await getAllProducts(lang);
    return (
      <Section tone="ivory">
        <Container>
          <p className="eyebrow text-rose">
            {key === 'cart' ? (lang === 'es' ? 'Tu compra' : 'Your purchase') : (lang === 'es' ? 'Guardados' : 'Saved')}
          </p>
          <h1 className="mt-3 text-h1">
            {key === 'cart' ? (lang === 'es' ? 'Tu bolsa' : 'Your bag') : (lang === 'es' ? 'Favoritos' : 'Favorites')}
          </h1>
          <Rule className="my-8" />
          <SavedList kind={key} products={products} locale={lang} />
        </Container>
      </Section>
    );
  }

  // `/rituals`: el único destino de este catch-all con datos reales detrás
  // (RITUAL_NEEDS, ya en uso y aprobados en `build-ritual.tsx`). Reutiliza
  // exactamente esas imágenes y enlaces en vez del texto plano genérico —
  // es el selector de necesidades completo, no un resumen de la home.
  if (key === 'rituals') {
    const page = ROUTE_PAGES[key]!;
    return (
      <Section tone="ivory">
        <Container>
          {/* Cabecera manual, no `SectionHeader`: ese componente pinta un
              `<h2>` pensado para secciones dentro de una página — aquí es el
              título de la página entera y debe ser `<h1>`. */}
          <header className="mb-10 max-w-2xl sm:mb-14">
            <p className="eyebrow mb-3 text-rose">{localizedCopy(page.eyebrow, lang)}</p>
            <h1 className="text-h1">{localizedCopy(page.title, lang)}</h1>
            <p className="mt-4 text-lead text-body">{localizedCopy(page.body[0]!, lang)}</p>
          </header>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RITUAL_NEEDS.map((need, i) => (
              <Reveal key={need.href} delay={i * 60}>
                <NeedCard need={need} locale={lang} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  const page = ROUTE_PAGES[key];
  if (!page) notFound();

  if (page.hero) {
    const hero = page.hero;
    return (
      <Section tone="ivory">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <Reveal className="frame-arch">
              <div className="aspect-[4/5]">
                <EditorialImage
                  src={hero.src}
                  alt={localizedCopy(hero.alt, lang)}
                  width={2000}
                  height={2500}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  focal={hero.focal}
                  fit={hero.fit ?? 'cover'}
                />
              </div>
            </Reveal>

            <Reveal delay={80} className="max-w-[34rem]">
              <p className="eyebrow mb-4 text-rose">{localizedCopy(page.eyebrow, lang)}</p>
              <h1 className="text-h1">{localizedCopy(page.title, lang)}</h1>
              <Rule className="my-7 max-w-24" />
              {page.body.map((paragraph) => (
                <p key={paragraph.en} className="mt-5 text-lead leading-relaxed text-body">
                  {localizedCopy(paragraph, lang)}
                </p>
              ))}
              <PageLinks page={page} lang={lang} />
            </Reveal>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section tone="ivory">
      <Container size="narrow">
        <p className="eyebrow text-rose">{localizedCopy(page.eyebrow, lang)}</p>
        <h1 className="mt-4 text-h1">{localizedCopy(page.title, lang)}</h1>
        <Rule className="my-8" />
        {page.body.map((paragraph) => (
          <p key={paragraph.en} className="mt-5 text-lead leading-relaxed text-body">
            {localizedCopy(paragraph, lang)}
          </p>
        ))}
        <PageLinks page={page} lang={lang} />
      </Container>
    </Section>
  );
}
