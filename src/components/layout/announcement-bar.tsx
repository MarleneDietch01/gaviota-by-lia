import { getSection } from '@/lib/content/sections';
import type { Locale } from '@/lib/i18n';

/**
 * Barra promocional. Server Component: el mensaje viene del contenido editable.
 *
 * Si la sección está en 'draft' o no existe, no se renderiza nada. Nunca se
 * muestra una promoción inventada ni una barra vacía.
 *
 * Fondo dorado con texto `ink`: 5.75:1, AA. En blanco daría 2.29:1 — el dorado
 * es demasiado claro para invertir el texto, aunque sea lo que pide el
 * instinto al ver una barra de color.
 */
export async function AnnouncementBar({ locale }: { locale: Locale }) {
  const section = await getSection('home.announcement', locale);

  if (!section?.title) return null;

  return (
    <div className="bg-gold text-center text-ink">
      <p className="px-4 py-2.5 text-caption font-medium tracking-[0.08em] sm:text-xs">
        {section.title}
      </p>
    </div>
  );
}
