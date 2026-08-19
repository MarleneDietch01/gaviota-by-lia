import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AuthorizationError, requireAdmin } from '@/lib/auth/guards';
import { signOutAdmin } from './actions';

const NAV = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/orders', label: 'Pedidos' },
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
    <div className="flex min-h-dvh">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-line bg-white-warm p-5">
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

      <main className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
