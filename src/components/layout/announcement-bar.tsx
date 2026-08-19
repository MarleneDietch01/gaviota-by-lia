import { getSection } from '@/lib/content/sections';
import type { Locale } from '@/lib/i18n';

/**
 * Barra promocional. Server Component: el mensaje viene del contenido editable.
 *
 * Si la sección está en 'draft' o no existe, no se renderiza nada. Nunca se
 * muestra una promoción inventada ni una barra vacía.
 */
export async function AnnouncementBar({ locale }: { locale: Locale }) {
  const section = await getSection('home.announcement', locale);

  if (!section?.title) return null;

  return (
    <div className="bg-wine text-center text-on-dark">
      <p className="px-4 py-2.5 text-[0.6875rem] font-medium tracking-[0.08em] sm:text-xs">
        {section.title}
      </p>
    </div>
  );
}
