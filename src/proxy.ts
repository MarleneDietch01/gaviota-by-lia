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
  // Cualquier ruta con un punto (`.`) queda fuera también: es la forma
  // general de excluir archivos estáticos servidos directo desde `public/`
  // (favicon.ico, sitemap.xml, robots.txt, site.webmanifest, cualquier
  // imagen bajo `images/`) o generados como convención de archivo en `app/`
  // (`sitemap.ts`, `robots.ts`). Sin esto, el proxy los trata como una ruta
  // de página y los redirige a `/es/lo-que-sea` (no existe) — así se detectó
  // con `googlef64233155e1fe420.html`, el archivo de verificación de Google
  // Search Console: 404 en vez de servirse. Antes esto se resolvía
  // agregando cada nombre de archivo a mano a esta lista, lo cual solo tapa
  // el síntoma para el próximo archivo de verificación que aparezca (Bing,
  // Pinterest, etc.) — la extensión es la señal real de "esto es un
  // archivo, no una página".
  matcher: ['/((?!api|_next/static|_next/image|admin|.*\\..*).*)'],
};
