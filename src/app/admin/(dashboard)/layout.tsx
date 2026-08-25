import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AuthorizationError, requireAdmin } from '@/lib/auth/guards';
import { signOutAdmin } from './actions';

const NAV = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/orders', label: 'Pedidos' },
  { href: '/admin/reviews', label: 'Reseñas' },
  { href: '/admin/users', label: 'Usuarios' },
] as const;

/**
 * Guard del panel entero.
 *
 * `requireAdmin()` es la MISMA función que ya protege las Server Actions de
 * administración (ver `lib/auth/guards.ts`) — no se reimplementa la
 * comprobación de rol aquí. Si lanza `AuthorizationError` (sin sesión o sin
 * rol admin/super_admin), se redirige al login; cualquier otro error sube tal
 * cual, porque eso sí sería un fallo real que no hay que enmascarar.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/admin/login');
    }
    throw error;
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Cabecera móvil/tablet: la barra lateral fija de 224px no cabe con
          contenido usable por debajo de `lg` — y la dueña puede despachar un
          pedido desde el teléfono, así que este rango no es secundario. La
          navegación pasa a una fila horizontal con scroll, sin ocultar
          ningún enlace detrás de un menú colapsado. */}
      <header className="flex items-center justify-between gap-4 border-b border-line bg-white-warm px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-lg">
          Gaviota <span className="accent-word">by Lia</span>
        </Link>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="min-h-9 rounded-xs border border-ink/25 px-3 text-xs font-medium transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
          >
            Salir
          </button>
        </form>
      </header>
      <nav
        aria-label="Panel"
        className="flex gap-1 overflow-x-auto border-b border-line bg-white-warm px-3 py-2 lg:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-10 shrink-0 items-center rounded-xs px-3 text-sm font-medium text-ink transition-colors hover:bg-ivory hover:text-rose"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-line bg-white-warm p-5 lg:flex">
        <div>
          <Link href="/admin" className="font-display text-lg">
            Gaviota <span className="accent-word">by Lia</span>
          </Link>
          <nav aria-label="Panel" className="mt-8">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-10 items-center rounded-xs px-3 text-sm font-medium text-ink transition-colors hover:bg-ivory hover:text-rose"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div>
          <Link
            href="/"
            className="mb-5 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-rose"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>

          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mb-3 text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
            {user.role === 'super_admin' ? 'Super admin' : 'Admin'}
          </p>
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="min-h-10 w-full rounded-xs border border-ink/25 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
