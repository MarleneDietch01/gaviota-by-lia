import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Container, Section } from '@/components/ui/layout-primitives';

/**
 * `not-found.tsx` files don't receive route `params` (Next.js file
 * convention — see `not-found.md` in the vendored docs), so this page has no
 * way to know whether the visitor is on `/en/...` or `/es/...`.
 *
 * The obvious workaround — reading the current path with `headers()` — was
 * tried and reverted: it forces Next to bail the ENTIRE `[lang]` segment out
 * of static rendering (every route sharing this layout lost its prerendered
 * `●` build output, not just this page). That regression is worse than the
 * bug being fixed, so this page is fully static and bilingual instead of
 * per-locale: both languages shown together rather than guessing one.
 */
export const metadata: Metadata = {
  title: 'Page not found · Página no encontrada',
  robots: { index: false },
};

const LINKS = [
  { href: '/shop', label: 'Shop · Tienda' },
  { href: '/sets', label: 'Sets · Kits' },
  { href: '/contact', label: 'Contact · Contacto' },
];

export default function NotFound() {
  return (
    <Section tone="ivory">
      <Container size="narrow">
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow text-rose">404</p>
          <h1 className="mt-4 text-h1">Page not found · Página no encontrada</h1>
          <p className="mt-5 text-lead text-body">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
            <br />
            La página que buscas no existe o pudo haberse movido.
          </p>

          <form action="/search" role="search" className="mt-8 flex gap-2">
            <span className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Search products · Buscar productos"
                aria-label="Search products · Buscar productos"
                className="min-h-12 w-full rounded-xs border border-line-strong bg-white-warm pl-10 pr-4 text-sm placeholder:text-muted"
              />
            </span>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm transition-colors hover:bg-rose-deep"
            >
              Search · Buscar
            </button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-xs border border-ink/25 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
