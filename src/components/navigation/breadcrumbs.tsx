import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export function Breadcrumbs({ items, locale }: { items: readonly BreadcrumbItem[]; locale: Locale }) {
  return (
    <nav aria-label={pick(locale, 'Breadcrumb', 'Ruta de navegación')}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <li>
          <Link href={localizedHref(locale, '/')} className="min-h-11 py-3 underline-offset-4 hover:underline">
            {pick(locale, 'Home', 'Inicio')}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-line-strong" aria-hidden="true" />
            {item.href ? (
              <Link href={localizedHref(locale, item.href)} className="min-h-11 py-3 underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="py-3 text-body">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
