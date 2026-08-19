'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Menu, Search, ShoppingBag, User, Heart, X } from 'lucide-react';
import { Container } from '@/components/ui/layout-primitives';
import { cn } from '@/lib/utils/cn';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import {
  ACCOUNT_NAV,
  CATEGORY_NAV,
  HELP_NAV,
  PRIMARY_NAV,
  label,
  type NavItem,
} from '@/lib/content/navigation';
import { getBagCount, subscribeBag } from '@/lib/commerce/bag';

/* ===========================================================================
   Header
   ---------------------------------------------------------------------------
   Rejilla de tres columnas con los laterales de ancho igual (`1fr auto 1fr`).
   Es lo que mantiene el logotipo ÓPTICAMENTE centrado en móvil: con un
   `justify-between` y un icono a la izquierda contra tres a la derecha, el
   logotipo se desplazaba visiblemente.

   Sobre el hero el header es transparente; a partir de 24px de scroll pasa a
   marfil sólido con hairline. La transición es de color, no de layout, así que
   no provoca reflow.
   =========================================================================== */

const ICON_BUTTON = 'grid size-11 place-items-center rounded-pill transition-colors duration-300 ease-soft hover:bg-ink/[0.06]';

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Almacén externo: el snapshot de servidor es 0, así que servidor y primer
  // render de cliente coinciden y no hay desajuste de hidratación.
  const bagCount = useSyncExternalStore(subscribeBag, getBagCount, () => 0);

  /* --- Accesibilidad del drawer ------------------------------------------
     Escape, bloqueo del scroll de fondo, foco llevado al panel al abrir,
     trampa de foco mientras está abierto y devolución del foco al botón que lo
     abrió. La versión anterior no hacía ninguna de las tres últimas: con el
     panel abierto el tabulador se paseaba por la página de detrás.            */
  useEffect(() => {
    if (!menuOpen) return;

    const drawer = drawerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [menuOpen]);

  const isActive = useCallback(
    (href: string) => {
      const target = localizedHref(locale, href);
      return pathname === target || pathname.startsWith(`${target}/`);
    },
    [locale, pathname],
  );

  const otherLocale: Locale = locale === 'en' ? 'es' : 'en';
  const localeHref = (targetLocale: Locale) =>
    pathname.replace(/^\/(?:en|es)(?=\/|$)/, `/${targetLocale}`) || `/${targetLocale}`;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ease-soft',
          scrolled
            ? 'border-b border-line bg-ivory/95 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <Container size="wide">
          {/* El logotipo va posicionado en el centro absoluto, no como columna
              central de una rejilla. Con `1fr auto 1fr`, si el grupo derecho es
              más ancho que el izquierdo la columna se expande y el logotipo se
              desplaza: medido, quedaba 35px a la izquierda del centro real en
              móvil. Así queda centrado sea cual sea el contenido lateral. */}
          <div className="relative flex h-16 items-center justify-between gap-3 lg:h-20">
            {/* --- Izquierda: menú (móvil) / navegación (escritorio) --- */}
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={pick(locale, 'Open menu', 'Abrir menú')}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                className={cn(ICON_BUTTON, '-ml-2 lg:hidden')}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>

              <nav
                aria-label={pick(locale, 'Main', 'Principal')}
                className="hidden lg:block"
              >
                <ul className="flex items-center gap-4 xl:gap-6">
                  {PRIMARY_NAV.map((item) => (
                    <li key={item.href}>
                      <HeaderLink item={item} locale={locale} active={isActive(item.href)} />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* --- Centro: logotipo --- */}
            <Link
              href={localizedHref(locale, '/')}
              // `gap-[0.26em]` NO es decorativo: este enlace es `flex`, y un
              // contenedor flex convierte el nodo de texto y el <span> en dos
              // ítems, descartando el espacio en blanco que los separa en el
              // JSX. Sin el gap se leía literalmente "Gaviotaby Lia".
              // En `em` para que la separación escale con el tamaño en los tres
              // breakpoints del logotipo.
              className="absolute left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-[0.26em] whitespace-nowrap font-display text-[1.375rem] tracking-[0.01em] sm:text-2xl lg:text-[1.75rem]"
            >
              Gaviota <span className="accent-word">by Lia</span>
            </Link>

            {/* --- Derecha: acciones --- */}
            <div className="flex items-center justify-end gap-0.5">
              <Link
                href={localeHref(otherLocale)}
                hrefLang={otherLocale === 'en' ? 'en-US' : 'es'}
                aria-label={pick(locale, 'Ver sitio en español', 'View site in English')}
                // Oculto por debajo de `sm`: con tres iconos a la derecha, el
                // grupo invadía el logotipo centrado a 360px. El cambio de
                // idioma sigue disponible en el drawer.
                className="hidden min-h-11 min-w-11 place-items-center rounded-pill text-[0.6875rem] font-bold tracking-[0.14em] transition-colors duration-300 hover:bg-ink/[0.06] sm:grid"
              >
                {otherLocale.toUpperCase()}
              </Link>

              <Link
                href={localizedHref(locale, '/search')}
                aria-label={pick(locale, 'Search', 'Buscar')}
                className={ICON_BUTTON}
              >
                <Search className="size-[1.15rem]" aria-hidden="true" />
              </Link>

              <Link
                href={localizedHref(locale, '/account')}
                prefetch={false}
                aria-label={pick(locale, 'My account', 'Mi cuenta')}
                className={cn(ICON_BUTTON, 'hidden lg:grid')}
              >
                <User className="size-[1.15rem]" aria-hidden="true" />
              </Link>

              <Link
                href={localizedHref(locale, '/wishlist')}
                prefetch={false}
                aria-label={pick(locale, 'Favorites', 'Favoritos')}
                className={cn(ICON_BUTTON, 'hidden lg:grid')}
              >
                <Heart className="size-[1.15rem]" aria-hidden="true" />
              </Link>

              <Link
                href={localizedHref(locale, '/cart')}
                prefetch={false}
                aria-label={
                  bagCount > 0
                    ? pick(locale, `Bag, ${bagCount} items`, `Bolsa, ${bagCount} artículos`)
                    : pick(locale, 'Bag, empty', 'Bolsa, vacía')
                }
                className={cn(ICON_BUTTON, 'relative')}
              >
                <ShoppingBag className="size-[1.15rem]" aria-hidden="true" />
                {bagCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="tabular absolute right-1 top-1 grid min-w-[1.125rem] place-items-center rounded-pill bg-rose px-1 text-[0.625rem] font-bold leading-[1.125rem] text-white-warm"
                  >
                    {bagCount > 9 ? '9+' : bagCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* --- Drawer móvil --- */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-wine/45 backdrop-blur-[2px]"
          />

          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={pick(locale, 'Site menu', 'Menú del sitio')}
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory shadow-drawer"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pl-5 pr-3">
              <span className="font-display text-xl">
                {pick(locale, 'Menu', 'Menú')}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={pick(locale, 'Close menu', 'Cerrar menú')}
                className={ICON_BUTTON}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* El drawer se cierra al navegar por delegación de eventos, no con
                un `useEffect` sobre `pathname`: llamar a setState dentro de un
                efecto provoca un render en cascada (y el linter de React 19 lo
                marca como error). Como todos los destinos son `<a>`, basta con
                escuchar el clic aquí. */}
            <div
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
              }}
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-6"
            >
              <Link
                href={localizedHref(locale, '/shop')}
                className="flex min-h-13 items-center justify-center rounded-xs bg-rose px-6 text-sm font-semibold tracking-[0.02em] text-white-warm"
              >
                {pick(locale, 'Shop the collection', 'Ver la colección')}
              </Link>

              <DrawerGroup
                title={pick(locale, 'Shop', 'Tienda')}
                items={CATEGORY_NAV}
                locale={locale}
                isActive={isActive}
              />

              <DrawerGroup
                title={pick(locale, 'Brand', 'Marca')}
                items={PRIMARY_NAV.slice(1)}
                locale={locale}
                isActive={isActive}
              />

              <DrawerGroup
                title={pick(locale, 'Account', 'Cuenta')}
                items={ACCOUNT_NAV}
                locale={locale}
                isActive={isActive}
              />

              <DrawerGroup
                title={pick(locale, 'Help', 'Ayuda')}
                items={HELP_NAV}
                locale={locale}
                isActive={isActive}
                muted
              />

              <hr className="rule-champagne my-7" />

              <div className="flex items-center justify-between">
                <span className="eyebrow text-rose">
                  {pick(locale, 'Language', 'Idioma')}
                </span>
                <div className="flex items-center gap-1">
                  <LocaleChip locale="en" current={locale} href={localeHref('en')} />
                  <LocaleChip locale="es" current={locale} href={localeHref('es')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* --- Enlace de cabecera con indicador de página activa ---------------------
   El estado activo NO se comunica solo con color: lleva un filete bajo el
   texto y `aria-current="page"`. Con color únicamente, un usuario con
   daltonismo no distingue la sección en la que está.                        */
function HeaderLink({
  item,
  locale,
  active,
}: {
  item: NavItem;
  locale: Locale;
  active: boolean;
}) {
  return (
    <Link
      href={localizedHref(locale, item.href)}
      prefetch={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // `min-h-11` y no `py-2`: el área táctil llega a 44px aunque el texto
        // mida 18. El filete va en el <span> interior para quedar pegado al
        // texto y no al borde inferior del área de toque.
        // `min-w-11` + `px-3` para que hasta la entrada más corta ("Kits")
        // alcance los 44px de ancho de objetivo táctil. El filete va en el
        // <span>, así que el padding no lo estira.
        'group flex min-h-11 min-w-11 items-center justify-center px-3 text-[0.8125rem] font-medium tracking-[0.03em] transition-colors duration-300',
        active ? 'text-rose' : 'text-ink hover:text-rose',
      )}
    >
      <span
        className={cn(
          'relative',
          'after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-rose after:transition-transform after:duration-300 after:ease-editorial',
          active ? 'after:scale-x-100' : 'after:scale-x-0 group-hover:after:scale-x-100',
        )}
      >
        {label(item, locale)}
      </span>
    </Link>
  );
}

function DrawerGroup({
  title,
  items,
  locale,
  isActive,
  muted = false,
}: {
  title: string;
  items: readonly NavItem[];
  locale: Locale;
  isActive: (href: string) => boolean;
  muted?: boolean;
}) {
  return (
    <nav aria-label={title} className="mt-8">
      <h2 className="eyebrow mb-2 text-rose">{title}</h2>
      <ul>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={`${title}-${item.href}`}>
              <Link
                href={localizedHref(locale, item.href)}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center text-[0.9375rem] transition-colors',
                  active
                    ? 'font-semibold text-rose'
                    : muted
                      ? 'text-body hover:text-ink'
                      : 'text-ink hover:text-rose',
                )}
              >
                {active ? (
                  <span aria-hidden="true" className="mr-2 h-4 w-px bg-rose" />
                ) : null}
                {label(item, locale)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LocaleChip({ locale, current, href }: { locale: Locale; current: Locale; href: string }) {
  const active = locale === current;
  return (
    <Link
      href={href}
      hrefLang={locale === 'en' ? 'en-US' : 'es'}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'grid min-h-11 min-w-11 place-items-center rounded-xs border text-[0.6875rem] font-bold tracking-[0.12em] transition-colors',
        active
          ? 'border-rose bg-rose text-white-warm'
          : 'border-line-strong text-body hover:border-ink hover:text-ink',
      )}
    >
      {locale.toUpperCase()}
    </Link>
  );
}
