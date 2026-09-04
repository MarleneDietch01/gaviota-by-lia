import 'server-only';

import type { NextRequest } from 'next/server';

/**
 * Comprueba que la petición vino del propio sitio.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ HACE FALTA
 * -----------------------------------------------------------------------------
 * `/api/checkout` es un Route Handler, no una Server Action — Next.js NO le
 * aplica la comprobación de origen que sí hace automáticamente con
 * `'use server'`. Sin esto, cualquier sitio podría montar un `fetch()` hacia
 * este endpoint desde el navegador de una visitante y crear pedidos
 * `pending_payment` en su nombre.
 *
 * El webhook (`/api/webhooks/stripe`) NO usa esta función: por diseño llega
 * desde fuera (los servidores de Stripe), y su autorización real es la firma
 * criptográfica, no el origen.
 * -----------------------------------------------------------------------------
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return false;

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(siteUrl).origin;
  } catch {
    return false;
  }

  const origin = request.headers.get('origin');
  if (origin) return origin === expectedOrigin;

  // Algunos navegadores omiten `Origin` en peticiones same-origin bajo ciertas
  // configuraciones; `Referer` es el respaldo. Sin ninguno de los dos
  // presentes, se rechaza — un `fetch` legítimo desde el propio sitio siempre
  // manda al menos uno.
  const referer = request.headers.get('referer');
  if (!referer) return false;

  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
}
