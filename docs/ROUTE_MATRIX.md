# Matriz de rutas

Estado al 10 de agosto de 2026. Todas las rutas públicas se sirven bajo `/es` y `/en`; `/` redirige a `/es`.

| Ruta | Existe | Responsive | SEO | Auth | Admin | E2E | Estado |
|---|---:|---:|---:|---:|---:|---:|---|
| `/`, `/shop`, `/categories/[slug]`, `/search` | ✅ | ✅ | 🟡 | No | No | 🟡 | ✅ completo / catálogo local |
| `/products/[slug]` | ✅ | ✅ | 🟡 | No | No | 🔴 | 🟡 PDP inicial; faltan galería y datos extensos |
| `/rituals`, `/ingredients`, `/sets` | ✅ | ✅ | ✅ básico | No | No | 🔴 | 🟡 contenido y navegación; comercio posterior |
| `/wishlist`, `/cart` | ✅ | ✅ | noindex | No | No | 🔴 | 🟡 guest local; sin carrito transaccional |
| `/our-story`, `/founder`, `/journal` | ✅ | ✅ | ✅ básico | No | No | 🔴 | 🟡 contenido aprobado limitado |
| `/faq`, `/contact`, `/track-order` | ✅ | ✅ | 🟡 | No | No | 🔴 | 🟡 rutas honestas; formularios backend pendientes |
| `/shipping-policy`, `/refund-policy`, `/privacy-policy`, `/terms`, `/cookies` | ✅ | ✅ | 🟡 | No | No | 🔴 | ⚠️ bloqueado por aprobación legal |
| `/best-sellers`, `/new`, `/offers` | 🔴 | — | — | No | No | 🔴 | ⚠️ requieren histórico/vigencias reales |
| `/checkout`, `/checkout/success/[publicToken]` | 🔴 | — | noindex | No | No | 🔴 | 🔐 checkout seguro pendiente |
| `/account/*` | 🔴 salvo entrada | — | noindex | Sí | No | 🔴 | 🟡 guards listos; UI/Auth pendiente |
| `/journal/[slug]` | 🔴 | — | — | No | No | 🔴 | ⚠️ sin artículos aprobados |
| `/admin` y módulos `/admin/*` | 🔴 | — | noindex | Sí | Sí | 🔴 | 🔐 guards listos; rutas pendientes |
| `not-found.tsx`, `error.tsx`, `shop/loading.tsx` | ✅ | ✅ | noindex | No | No | 🔴 | ✅ |
| `global-error.tsx`, loading global | 🔴 | — | — | No | No | 🔴 | 🔴 |
