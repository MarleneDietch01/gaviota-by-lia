import Link from 'next/link';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { Container, Rule } from '@/components/ui/layout-primitives';
import {
  BRAND_NAV,
  CATEGORY_NAV,
  HELP_NAV,
  LEGAL_NAV,
  label,
  type NavItem,
} from '@/lib/content/navigation';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

const COLUMNS: readonly { title: { en: string; es: string }; items: readonly NavItem[] }[] = [
  { title: { en: 'Shop', es: 'Tienda' }, items: CATEGORY_NAV },
  { title: { en: 'Brand', es: 'Marca' }, items: BRAND_NAV },
  { title: { en: 'Help', es: 'Ayuda' }, items: HELP_NAV },
  { title: { en: 'Legal', es: 'Legal' }, items: LEGAL_NAV },
];

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="on-dark bg-wine text-on-dark">
      <Container size="wide">
        <div className="py-16 lg:py-20">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-10">
            <div className="max-w-xs">
              <p className="font-display text-2xl">
                Gaviota <span className="accent-word">by Lia</span>
              </p>

              <p className="mt-4 text-sm leading-relaxed text-on-dark-soft">
                {pick(
                  locale,
                  'Dominican-inspired body care, made for every body.',
                  'Cuidado corporal inspirado en la belleza dominicana, para todos los cuerpos.',
                )}
              </p>

              <a
                href="https://www.instagram.com/gaviotabylia/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-on-dark-soft transition-colors hover:text-on-dark"
              >
                <InstagramIcon className="size-4" />
                @gaviotabylia
                <span className="sr-only">
                  {pick(locale, '(opens in a new tab)', '(se abre en una pestaña nueva)')}
                </span>
              </a>
            </div>

            {COLUMNS.map((column) => (
              <nav key={column.title.en} aria-label={pick(locale, column.title.en, column.title.es)}>
                <h2 className="eyebrow mb-4 text-on-dark-soft">
                  {pick(locale, column.title.en, column.title.es)}
                </h2>
                <ul className="space-y-1">
                  {column.items.map((item) => (
                    <li key={`${column.title.en}-${item.href}`}>
                      <Link
                        href={localizedHref(locale, item.href)}
                        prefetch={false}
                        className="flex min-h-11 items-center text-sm text-on-dark-soft transition-colors hover:text-on-dark"
                      >
                        {label(item, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <Rule className="my-12 opacity-45" />

          <div className="flex flex-col gap-4 text-xs leading-relaxed text-on-dark-soft sm:flex-row sm:items-start sm:justify-between">
            <p>
              © {new Date().getFullYear()} Gaviota by Lia.{' '}
              {pick(locale, 'All rights reserved.', 'Todos los derechos reservados.')}
            </p>
            <p className="sm:max-w-md sm:text-right">
              {pick(
                locale,
                'Gaviota by Lia products are cosmetics and do not replace advice from a healthcare professional.',
                'Los productos Gaviota by Lia son cosméticos y no sustituyen la evaluación de un profesional de la salud.',
              )}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
