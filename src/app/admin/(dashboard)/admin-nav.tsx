"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Package,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/team", label: "Equipo", icon: ShieldCheck },
  { href: "/admin/reviews", label: "Reseñas", icon: MessageSquareText },
] as const;

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Panel"
      className={
        mobile
          ? "overflow-x-auto border-b border-line bg-white-warm px-3 py-2 shadow-subtle lg:hidden"
          : "mt-8"
      }
    >
      <ul className={mobile ? "flex w-max gap-1" : "space-y-1.5"}>
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-sm px-3 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                  active
                    ? "bg-champagne text-ink shadow-subtle"
                    : "text-body hover:bg-gold/35 hover:text-ink"
                }`}
              >
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
