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
  // `favicon.ico` es el fallback clásico que el navegador pide en la raíz del
  // dominio: sin excluirlo, el proxy lo redirige a `/es/favicon.ico` (no existe)
  // y el icono de pestaña desaparece. El resto del juego de iconos (icon.svg,
  // 16/32, apple-touch, android-chrome, site.webmanifest) vive bajo
  // `public/images/gaviota/favicon/`, ya cubierto por `images`, y se declara
  // explícito en `[lang]/layout.tsx`. `icon.png`/`apple-icon.png` se mantienen
  // en la lista por si se reintroduce una convención de archivo en `app/`.
  //
  // `sitemap.xml`/`robots.txt` son la misma convención de archivo (`src/app/
  // sitemap.ts` / `robots.ts`), mismo problema: sin excluirlas, Google pide
  // `/sitemap.xml`, el proxy lo manda a `/en/sitemap.xml` (no existe) y el
  // sitemap desaparece del rastreo.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sitemap.xml|robots.txt|images|admin).*)',
  ],
};
