import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { pick, type Locale } from '@/lib/i18n';

const WHATSAPP_NUMBER = '14013058713';

/** Acceso directo global: enlace real, sin widget ni script de terceros. */
export function WhatsAppButton({ locale }: { locale: Locale }) {
  const message = pick(
    locale,
    'Hello Gaviota by Lia, I would like some help.',
    'Hola Gaviota by Lia, me gustaría recibir ayuda.',
  );
  const label = pick(locale, 'Chat with us on WhatsApp', 'Escríbenos por WhatsApp');
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

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
      className="fixed bottom-24 right-5 z-30 inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-rose-deep px-3.5 text-sm font-semibold text-white-warm shadow-lift transition-[background-color,transform] duration-300 ease-soft hover:bg-rose-ink motion-safe:hover:-translate-y-0.5 sm:right-6 sm:px-5 lg:bottom-6"
    >
      <WhatsAppIcon className="size-5 shrink-0" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
