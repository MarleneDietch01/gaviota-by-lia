# SITEMAP.md — Mapa del sitio

Estructura de rutas de la plataforma nueva. Cada ruta indica su tipo de renderizado,
si requiere autenticación y su objetivo comercial.

**Renderizado:** `SSG` estático · `ISR` estático revalidado · `SSR` dinámico en servidor · `CSR` cliente
**Acceso:** 🌐 público · 🔒 cliente autenticado · 🛡️ administrador

---

## 1. Storefront público — `src/app/(store)/`

| Ruta | Render | Acceso | Objetivo comercial |
|---|---|---|---|
| `/` | ISR 60s | 🌐 | Generar deseo y conducir al catálogo |
| `/shop` | ISR 60s | 🌐 | Descubrimiento y filtrado del catálogo completo |
| `/shop?categoria=&precio=&orden=` | SSR | 🌐 | Filtros en parámetros de URL (compartibles e indexables) |
| `/categories/[slug]` | ISR 60s | 🌐 | Entrada segmentada por categoría |
| `/products/[slug]` | ISR 60s | 🌐 | **Conversión.** Ruta más importante del sitio |
| `/kits` | ISR 60s | 🌐 | Aumento del ticket medio |
| `/routine` | ISR 300s | 🌐 | Educar y hacer descubrir producto (ritual en 3 pasos) |
| `/ingredients` | ISR 300s | 🌐 | Confianza y transparencia |
| `/our-story` | ISR 300s | 🌐 | Historia de marca |
| `/founder` | ISR 300s | 🌐 | Confianza y cercanía |
| `/journal` | ISR 300s | 🌐 | SEO de contenido. **Ver nota §1.1** |
| `/journal/[slug]` | ISR 300s | 🌐 | Artículo |
| `/faq` | ISR 300s | 🌐 | Reducir fricción y consultas de soporte |
| `/contact` | SSG + acción | 🌐 | Atención al cliente |
| `/search` | SSR | 🌐 | Encontrar producto |
| `/cart` | CSR | 🌐 | Revisión del carrito |
| `/checkout` | SSR | 🌐 | **Compra.** Sin caché nunca |
| `/order-confirmation/[token]` | SSR | 🌐 | Confirmación por token público seguro |
| `/track-order` | SSR | 🌐 | Seguimiento sin cuenta. Sustituye a Track123 |

### 1.1 Nota sobre `/journal`
El blog actual (`/blogs/news`) **existe pero está vacío**: cero artículos. Se construye la
ruta y se redirige `/blogs/news` → `/journal`, pero **el enlace no aparecerá en la
navegación hasta que haya al menos tres artículos publicados**. Un blog vacío enlazado
desde el header resta credibilidad. Es un interruptor en `site_settings`.

### 1.2 Páginas legales

| Ruta | Render | Origen |
|---|---|---|
| `/shipping-policy` | ISR 300s | Contenido actual reutilizable, faltan tarifas |
| `/refund-policy` | ISR 300s | **Reescribir** — marcadores sin rellenar |
| `/privacy-policy` | ISR 300s | **Reescribir de cero** — plantilla Shopify |
| `/terms` | ISR 300s | **Reescribir de cero** |
| `/cookies` | ISR 300s | 🆕 No existe. Necesaria por el banner de consentimiento |

Las cinco se gestionan desde `content_sections`, editables sin desplegar.

---

## 2. Área del cliente — `src/app/account/`

| Ruta | Render | Acceso |
|---|---|---|
| `/account` | SSR | 🔒 Resumen: último pedido, accesos rápidos |
| `/account/orders` | SSR | 🔒 Listado de pedidos propios |
| `/account/orders/[orderNumber]` | SSR | 🔒 Detalle + tracking + repetir pedido |
| `/account/addresses` | SSR | 🔒 Direcciones guardadas |
| `/account/profile` | SSR | 🔒 Datos personales |
| `/account/favorites` | SSR | 🔒 Favoritos |
| `/account/security` | SSR | 🔒 Contraseña y cierre de sesión |

### 2.1 Autenticación — `src/app/(auth)/`

| Ruta | Acceso |
|---|---|
| `/login` | 🌐 |
| `/register` | 🌐 |
| `/forgot-password` | 🌐 |
| `/reset-password` | 🌐 (token) |
| `/auth/callback` | 🌐 Route Handler de Supabase |

**Regla de seguridad.** Ninguna ruta bajo `/account` se autoriza en cliente. La sesión y
la propiedad del recurso se verifican en servidor, y las políticas RLS son la segunda
barrera: aunque una consulta se escapara, la base de datos no devolvería datos ajenos.

---

## 3. Panel administrativo — `src/app/admin/`

| Ruta | Acceso | Módulo |
|---|---|---|
| `/admin` | 🛡️ | Dashboard: ventas del día y del mes, pedidos, ticket medio, bajo inventario |
| `/admin/products` | 🛡️ | Listado + búsqueda + filtros |
| `/admin/products/new` | 🛡️ | Crear |
| `/admin/products/[id]` | 🛡️ | Editar: datos, variantes, imágenes, SEO |
| `/admin/categories` | 🛡️ | Crear, editar, ordenar |
| `/admin/orders` | 🛡️ | Listado con filtros por estado |
| `/admin/orders/[id]` | 🛡️ | Detalle, estados, tracking, notas, historial |
| `/admin/inventory` | 🛡️ | Stock actual, ajustes, bajo inventario |
| `/admin/inventory/movements` | 🛡️ | Historial + exportación CSV |
| `/admin/customers` | 🛡️ | Listado y ficha |
| `/admin/customers/[id]` | 🛡️ | Pedidos y total gastado |
| `/admin/coupons` | 🛡️ | Alta y gestión |
| `/admin/content` | 🛡️ | **Contenido editable del sitio** |
| `/admin/content/[sectionKey]` | 🛡️ | Editar una sección |
| `/admin/content/faqs` | 🛡️ | Preguntas frecuentes |
| `/admin/reports` | 🛡️ | Ventas por periodo, más vendidos |
| `/admin/settings` | 🛡️ | Negocio, envíos, redes, SEO |
| `/admin/audit` | 🛡️ (super_admin) | Registro de acciones |

**Regla.** `/admin` se protege en el `layout.tsx` de servidor **y** en cada Server Action.
El layout no basta: una Server Action es un endpoint invocable directamente.

---

## 4. Route Handlers — `src/app/api/`

| Ruta | Método | Acceso | Propósito |
|---|---|---|---|
| `/api/webhooks/payments` | POST | 🌐 firmado | **Confirmación de pago.** Verifica firma, idempotente |
| `/api/payments/session` | POST | 🌐 | Crea sesión de pago (totales recalculados en servidor) |
| `/api/contact` | POST | 🌐 | Formulario de contacto (rate limit + antispam) |
| `/api/newsletter` | POST | 🌐 | Alta en newsletter |
| `/api/newsletter/unsubscribe` | GET | 🌐 token | Baja con token firmado |
| `/api/cron/release-reservations` | POST | 🔑 `CRON_SECRET` | Libera reservas de inventario expiradas |
| `/api/cron/expire-carts` | POST | 🔑 `CRON_SECRET` | Caduca carritos anónimos |
| `/api/revalidate` | POST | 🔑 interno | Revalida caché tras editar contenido |
| `/sitemap.xml` | GET | 🌐 | Sitemap dinámico |
| `/robots.txt` | GET | 🌐 | Robots |
| `/opengraph-image` | GET | 🌐 | Imagen social (hoy el sitio no tiene) |

**El webhook de pagos es el punto más sensible del sistema.** Verifica firma antes de
parsear, registra el evento en `payment_events` con `provider_event_id` único, y descarta
duplicados. Un pedido nunca pasa a `paid` por una redirección del navegador.

---

## 5. Rutas especiales

| Archivo | Propósito |
|---|---|
| `not-found.tsx` | 404 de marca con buscador y productos destacados |
| `error.tsx` | Error con opción de reintento |
| `global-error.tsx` | Fallo del layout raíz |
| `loading.tsx` | Skeletons por segmento |

---

## 6. Estructura del home comercial (19 secciones)

Orden definido por la dirección creativa. La columna **Datos** indica si la sección puede
mostrarse en el lanzamiento con datos reales.

| # | Sección | Componente | Editable | Datos en lanzamiento |
|---|---|---|---|---|
| 1 | Barra promocional | `AnnouncementBar` | ✅ | ✅ Sí |
| 2 | Header | `SiteHeader` | parcial | ✅ Sí |
| 3 | Hero de campaña | `HeroCampaign` | ✅ | ✅ Sí |
| 4 | Pruebas de confianza | `TrustBar` | ✅ | ✅ Sí |
| 5 | Más vendidos | `BestSellers` | ✅ | ⚠️ Sin histórico → usa "destacados" |
| 6 | ¿Qué necesita tu piel? | `NeedsSelector` | ✅ | ⚠️ 5 opciones, no 8 |
| 7 | Campaña destacada | `FeaturedCampaign` | ✅ | ✅ Sí |
| 8 | Ritual en 3 pasos | `RitualSteps` | ✅ | ⚠️ Requiere definir el orden |
| 9 | Producto protagonista | `HeroProduct` | ✅ | ✅ Sí |
| 10 | Historia breve | `BrandStory` | ✅ | ✅ Sí |
| 11 | Kits y combinaciones | `KitsSection` | ✅ | ⚠️ Ahorro real del 7,7 % |
| 12 | Comunidad | `CommunitySection` | ✅ | ✅ Sí (fotos 9, 11, 17, 18) |
| 13 | Testimonios verificados | `Testimonials` | ✅ | ❌ **0 reseñas → oculta** |
| 14 | Contenido de clientes (UGC) | `UgcGallery` | ✅ | ❌ **No existe → oculta** |
| 15 | Beneficios de comprar | `PurchaseBenefits` | ✅ | ✅ Sí |
| 16 | Instagram | `InstagramFeed` | ✅ | ⚠️ Requiere decisión (§6.1) |
| 17 | Newsletter | `NewsletterSignup` | ✅ | ✅ Sí |
| 18 | FAQ | `FaqAccordion` | ✅ | ⚠️ Requiere redactar las preguntas |
| 19 | Footer | `SiteFooter` | ✅ | ✅ Sí |

**12 de 19 secciones se lanzan con datos reales completos.** Las restantes se construyen
igualmente y se activan cuando existan los datos, mediante el interruptor
`content_sections.status`. Ninguna se rellena con contenido inventado.

### 6.1 Secciones que no se mostrarán en el lanzamiento

| Sección | Motivo | Cuándo se activa |
|---|---|---|
| **13. Testimonios** | El sitio actual no tiene ni una sola reseña | Con ≥5 reseñas verificadas (`verified_purchase = true`) |
| **14. UGC** | No hay fotografías de clientas autorizadas | Cuando la propietaria aporte material con permiso por escrito |
| **16. Instagram** | Requiere token de la API de Instagram, y el feed embebido perjudica el LCP | Alternativa MVP: rejilla estática editable desde el panel, con enlace a Instagram |

Para las secciones 5 y 8, el orden del ritual y los productos destacados se configuran a
mano desde el panel hasta que haya datos de venta propios.

**Regla que se respeta en todo el home:** *"No inventar badges ni escasez."* Ninguna
sección mostrará estrellas vacías, contadores falsos ni "más vendido" sin ventas detrás.

---

## 7. Jerarquía de navegación

### Header — escritorio
```
[Logo]   Tienda ▾   Más vendidos   Rutinas   Kits   Nuestra historia      [🔍] [👤] [♡] [🛒]
          │
          ├─ Todos los productos      → /shop
          ├─ Aceites y sérums         → /categories/aceites-y-serums
          ├─ Cremas e hidratación     → /categories/cremas-e-hidratacion
          ├─ Exfoliación              → /categories/exfoliacion
          ├─ Kits                     → /kits
          └─ Ingredientes             → /ingredients
```

Transparente sobre el hero, sólido al hacer scroll. `Nuestra historia` agrupa `/our-story`
y `/founder`.

### Header — móvil
```
[☰]        [Logo]        [🔍] [🛒]
```
Menú lateral con: Comprar (destacado) · categorías · Rutinas · Kits · Nuestra historia ·
La fundadora · FAQ · Seguir mi pedido · Cuenta.

### Footer
```
Tienda            Marca                 Ayuda                Legal
Todos             Nuestra historia      Contacto             Envíos
Aceites y sérums  La fundadora          FAQ                  Devoluciones
Cremas            Ingredientes          Seguir mi pedido     Privacidad
Exfoliación       Rutinas               Mi cuenta            Términos
Kits                                                         Cookies

[Newsletter]   [Instagram @gaviotabylia]   [Métodos de pago]
```

---

## 8. Indexación

| Grupo | ¿Indexable? | En sitemap |
|---|---|---|
| Home, catálogo, producto, categoría, kits | ✅ | ✅ |
| Contenido de marca (historia, fundadora, rutina, ingredientes, journal, FAQ) | ✅ | ✅ |
| Políticas legales | ✅ | ✅ |
| Contacto | ✅ | ✅ |
| `/search` y `/shop` con filtros | ❌ `noindex, follow` | ❌ |
| `/cart`, `/checkout` | ❌ `noindex, nofollow` | ❌ |
| `/order-confirmation/[token]`, `/track-order` | ❌ `noindex, nofollow` | ❌ |
| `/account/*` | ❌ `noindex, nofollow` | ❌ |
| `/admin/*` | ❌ `noindex, nofollow` + bloqueado en robots | ❌ |
| `/api/*` | ❌ | ❌ |

`/shop` sin filtros **sí** se indexa; con filtros aplicados, no, para evitar contenido
duplicado. Canonical de cualquier variante filtrada → `/shop`.

---

## 9. Datos estructurados

El sitio actual **no tiene ninguno**. Se implementan:

| Schema | Dónde |
|---|---|
| `Organization` | Layout raíz (nombre legal, logo, contacto, `sameAs` Instagram) |
| `WebSite` + `SearchAction` | Layout raíz |
| `Product` + `Offer` | `/products/[slug]` — precio, moneda, disponibilidad real |
| `AggregateRating` | `/products/[slug]` **solo si hay reseñas reales** |
| `BreadcrumbList` | Catálogo, categoría, producto, journal |
| `FAQPage` | `/faq` y bloque FAQ de la ficha de producto |
| `Article` | `/journal/[slug]` |

`AggregateRating` sin reseñas reales es una infracción directa de las directrices de
Google y motivo de penalización manual. No se emite hasta que existan.

---

## 10. Comparativa con el sitio actual

| | Actual | Nueva |
|---|---|---|
| Páginas de contenido | 3 | 9 |
| Rutas públicas | ~16 | 24 |
| Área de cliente | Shopify externo | 7 rutas propias |
| Panel administrativo | Shopify | 18 rutas propias |
| Datos estructurados | 0 | 7 tipos |
| FAQ | ❌ (2 enlaces engañosos) | ✅ |
| Seguimiento de pedidos | App externa | ✅ Propio |
| Búsqueda | Básica de Shopify | ✅ Propia con filtros |
| Política de cookies | ❌ | ✅ |
