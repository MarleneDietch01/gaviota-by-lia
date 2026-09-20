'use client';

import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { pick, type Locale } from '@/lib/i18n';
import { whatsAppHref } from '@/lib/contact/whatsapp';
import { useConsent } from '@/lib/analytics/use-consent';
import { cn } from '@/lib/utils/cn';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Acceso directo global: enlace real, sin widget ni script de terceros. */
export function WhatsAppButton({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const productPage = /^\/(?:en|es)\/products\/[^/]+\/?$/.test(pathname);
  // Rutas donde este botón flotante TAPA un control real por debajo de `lg`.
  // Medido en Chromium a 390 px, no deducido del código:
  //
  //   · La bolsa apila cupón, resumen y "Ir a pagar" contra el borde
  //     inferior — el botón cae sobre el campo del cupón con la bolsa corta,
  //     y sobre el resumen al bajar.
  //   · El catálogo (tienda, categoría y búsqueda) con el panel "Filtrar y
  //     ordenar" desplegado: el botón se superpone al `select` de orden y al
  //     botón "Aplicar". Los dos son interactivos, así que no es un solape
  //     estético: se queda con la pulsación.
  //
  // A partir de `lg` hay margen de sobra en la esquina y vuelve a aparecer,
  // igual que ya hacía en la ficha de producto.
  const cartPage = /^\/(?:en|es)\/cart\/?$/.test(pathname);
  const catalogPage = /^\/(?:en|es)\/(?:shop|search|categories(?:\/|$))/.test(pathname);
  const { status } = useConsent();
  // El aviso de cookies (`cookie-consent-banner.tsx`) ocupa bottom-0 a
  // TODOS los anchos mientras no hay respuesta, no solo por debajo de `lg`
  // como la barra de compra de arriba — así que aquí se oculta del todo, sin
  // excepción de `lg`.
  const consentPending = Boolean(GA_ID) && status === 'unknown';
  const display = consentPending
    ? 'hidden'
    : productPage || cartPage || catalogPage
      ? 'hidden lg:inline-flex'
      : 'inline-flex';
  const message = pick(
    locale,
    'Hello Gaviota by Lia, I would like some help.',
    'Hola Gaviota by Lia, me gustaría recibir ayuda.',
  );
  const label = pick(locale, 'Chat with us on WhatsApp', 'Escríbenos por WhatsApp');
  const href = whatsAppHref(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      // `bottom-24` y no `bottom-5` en móvil/tablet: la ficha de producto tiene
      // una barra fija de "Añadir a la bolsa" (`fixed inset-x-0 bottom-0`,
      // ~69px de alto) que hasta `lg` cubre el mismo ancho de pantalla — con
      // `bottom-5` este botón quedaba encima de esa barra, tapando la acción
      // de compra. A partir de `lg` la barra ya no existe (`lg:hidden` en la
      // ficha), así que ahí sí vuelve a la esquina ajustada.
      className={cn(
        'fixed bottom-24 right-5 z-30 min-h-12 items-center justify-center gap-2 rounded-pill border border-gold-deep/25 bg-champagne px-3.5 text-sm font-semibold text-ink shadow-lift transition-[background-color,transform] duration-300 ease-soft hover:bg-gold motion-safe:hover:-translate-y-0.5 sm:right-6 sm:px-5 lg:bottom-6',
        display,
      )}
    >
      <WhatsAppIcon className="size-5 shrink-0" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
