import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontVariables } from '@/lib/fonts';
import '../globals.css';

/**
 * Layout raíz del panel de administración.
 *
 * Vive FUERA de `[lang]/`: es una herramienta interna, no una página de marca
 * bilingüe, y `[lang]/layout.tsx` envuelve todo lo que cuelga de él con
 * `SiteHeader`/`SiteFooter` del storefront — no lo que necesita un panel.
 * Como no hay `src/app/layout.tsx`, este árbol puede declarar su propio
 * `<html>`/`<body>` sin heredar nada del sitio público.
 */
export const metadata: Metadata = {
  title: { default: 'Panel — Gaviota by Lia', template: '%s · Panel · Gaviota by Lia' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body className="min-h-dvh bg-ivory font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
