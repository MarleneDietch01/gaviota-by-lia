# Matriz RLS

Auditoría de las migraciones `20260803120015_rls_policies.sql` y `20260803120018_storage.sql`. `—` significa denegado por ausencia de policy; `propio` significa limitado por `auth.uid()`; `activo` significa solo contenido publicado. La service role omite RLS y debe permanecer exclusivamente en servidor.

| Tabla | anon select | anon insert | auth select | auth insert | auth update | admin | service |
|---|---|---|---|---|---|---|---|
| profiles | — | — | propio | trigger auth | propio | CRUD limitado | total |
| addresses | — | — | propio | propio | propio | lectura | total |
| categories, products, variants, images, related | activo | — | activo | — | — | CRUD | total |
| inventory_movements | — | — | — | — | — | lectura; ajustes por función | total |
| carts, cart_items | — | — | propio | propio | propio | lectura | total |
| orders, order_items, order_addresses, status_history | — | — | propio/lectura | — | — | CRUD según tabla | total |
| payments, payment_events | — | — | — | — | — | lectura | total |
| shipments | — | — | propio | — | — | CRUD | total |
| shipping_rates | activo | — | activo | — | — | CRUD | total |
| coupons | — | — | — | — | — | CRUD | total |
| coupon_redemptions | — | — | propio | — | — | CRUD | total |
| favorites | — | — | propio | propio | propio | por RLS propio | total |
| reviews | aprobadas | — | aprobadas + propias | propia pendiente/no verificada | propia pendiente | CRUD/moderación | total |
| content_sections, faqs | activo | — | activo | — | — | CRUD | total |
| site_settings | — | — | — | — | — | CRUD | total |
| newsletter_subscribers, contact_messages | — | — | — | — | — | gestión | total |
| email_log | — | — | — | — | — | lectura | total |
| audit_logs | — | — | — | — | — | super_admin lectura | total |
| storage products/categories | público | — | público | admin | admin | CRUD | total |
| storage content | público | — | público | admin | admin | CRUD | total |

🔐 Hallazgo: `content` permite SVG en la allowlist del bucket. Aunque la escritura es admin-only, SVG administrable puede contener contenido activo; debe retirarse o sanearse/servirse con aislamiento antes de producción.

Las 42 pruebas negativas RLS quedan preparadas pero se omiten localmente cuando no existen credenciales de Supabase; no se consideran verificadas en Cloud.
