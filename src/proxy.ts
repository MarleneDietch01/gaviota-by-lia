import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/lib/i18n';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // `admin` queda fuera: es una herramienta interna sin prefijo de idioma,
  // con su propio layout raíz en `src/app/admin/` (ver ese archivo).
  //
  // `icon.png`/`apple-icon.png` son las convenciones de archivo de Next para
  // `<link rel="icon">`/`apple-touch-icon` (ver `src/app/icon.png`): viven en
  // la raíz de `app/`, así que sin excluirlas aquí el proxy las redirige a
  // `/es/icon.png`, que no existe, y el favicon deja de cargar en todo el sitio.
  //
  // `sitemap.xml`/`robots.txt` son la misma convención de archivo (`src/app/
  // sitemap.ts` / `robots.ts`), mismo problema: sin excluirlas, Google pide
  // `/sitemap.xml`, el proxy lo manda a `/en/sitemap.xml` (no existe) y el
  // sitemap desaparece del rastreo.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sitemap.xml|robots.txt|images|admin).*)',
  ],
};
