'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/orders', label: 'Pedidos' },
  { href: '/admin/customers', label: 'Clientes' },
  { href: '/admin/team', label: 'Equipo y permisos' },
  { href: '/admin/reviews', label: 'Reseñas' },
] as const;

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="Panel" className={mobile ? 'flex gap-1 overflow-x-auto border-b border-line bg-white-warm px-3 py-2 lg:hidden' : 'mt-8'}>
    <ul className={mobile ? 'contents' : 'space-y-1'}>
      {NAV.map((item) => {
        const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
        return <li key={item.href} className={mobile ? 'contents' : undefined}>
          <Link href={item.href} aria-current={active ? 'page' : undefined}
            className={`flex min-h-10 shrink-0 items-center rounded-xs px-3 text-sm font-medium transition-colors ${active ? 'bg-rose text-white-warm' : 'text-ink hover:bg-ivory hover:text-rose'}`}>
            {item.label}
          </Link>
        </li>;
      })}
    </ul>
  </nav>;
}
