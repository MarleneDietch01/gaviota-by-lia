# Estado de implementación de la tienda

Fecha de auditoría: 10 de agosto de 2026.

## Resumen ejecutivo por severidad

| Área | Estado | Evidencia / siguiente paso |
|---|---|---|
| Home y sistema visual | ✅ completo | Se conserva la dirección existente, responsive e imágenes procesadas |
| Header/footer y rutas visibles | ✅ completo en Sprint A | Destinos localizados existentes; prueba de navegación declarativa |
| Idioma predeterminado | ✅ completo | `/` redirige a `/es`; selector conserva la ruta equivalente |
| Shop/categorías/búsqueda | 🟡 parcial | Funciona sobre catálogo verificado local; falta adaptador Supabase y filtros dependientes de datos |
| PDP | 🟡 parcial | Ruta, packshot completo, precio, quick add, wishlist y relacionados; faltan módulos avanzados |
| Wishlist/bolsa guest | 🟡 parcial | Persistencia local, lista, cantidades y remove; falta merge/auth y servidor |
| Newsletter/contacto/tracking | 🔴 pendiente | No se consideran funcionales hasta tener APIs, rate limiting y persistencia |
| Checkout/órdenes/pagos/webhooks | 🔐 security critical | No expuestos como compra real; requieren implementación transaccional |
| Cuenta/Auth | 🟡 parcial | Clientes y guards listos; rutas autenticadas pendientes |
| Admin | 🔴 pendiente | Guards listos; UI y acciones server-side pendientes |
| RLS | 🟡 parcial | 29 tablas con deny-by-default; 42 tests escritos, bloqueados sin Supabase local/Cloud |
| Storage | ✅ política base | SVG retirado de buckets públicos; MIME/tamaño y admin-only |
| Legal | ⚠️ bloqueado | Faltan decisiones indicadas en `LEGAL_TODO.md`; no se inventó texto legal |
| Tests E2E/capturas | 🔴 pendiente | Se abordarán tras estabilizar Sprint A en build de producción |

Documentos de auditoría: `ROUTE_MATRIX.md`, `INTERACTION_MATRIX.md`, `RLS_MATRIX.md` y `COMPETITIVE_BENCHMARK.md`.

## Existente

- Next.js 16 App Router con rutas localizadas `en` y `es`, Server Components y
  proxy de idioma.
- Home editorial completo, responsive y bilingüe.
- Sistema visual aprobado: Cormorant Garamond, Manrope y tokens de marca.
- Sistema de imágenes centralizado con packshots completos y puntos focales.
- Header, drawer accesible, footer y navegación declarativa.
- `ProductCard` reutilizable con quick add y favoritos locales.
- Bolsa y favoritos persistidos en `localStorage` sin guardar precios.
- Catálogo local verificado de siete fichas y utilidad Money en centavos.
- 18 migraciones SQL para identidad, catálogo, inventario, carrito, pedidos,
  pagos, envío, cupones, favoritos, reseñas, contenido y auditoría.
- RLS habilitado en las 29 tablas públicas; políticas de mínimo privilegio,
  funciones críticas, índices, triggers y políticas de Storage.
- Cinco suites pgTAP y 42 pruebas RLS/integración preparadas.
- 19 pruebas unitarias de dinero pasando.
- ESLint, TypeScript y build de producción pasando en la línea base.
- Sprint 1: `/shop`, `/categories/[slug]` y `/search`, con catálogo server-side,
  búsqueda sin acentos, filtros/orden en URL, breadcrumbs, conteo, empty state,
  loading skeleton y error boundary.
- Cuatro pruebas unitarias del motor de catálogo.

## Parcialmente implementado

- Catálogo: storefront de Sprint 1 completo sobre fuente local; falta cambiar el
  adaptador a Supabase y añadir datos reales de stock/promoción/histórico.
- Carrito: guarda intención y cantidades en navegador; no es todavía carrito
  transaccional ni consulta precios/stock en servidor.
- Wishlist: funciona para invitado; falta persistencia Supabase y fusión al
  autenticar.
- Cuenta y guards: existen clientes Supabase y helpers iniciales, no las rutas.
- Contenido: home y navegación son bilingües; faltan páginas comerciales y
  políticas finales.
- Base de datos: esquema y pruebas están escritos, pero no se ha verificado aún
  contra Supabase Cloud.

## Pendiente

- Sprint 2: PDP, wishlist remota, rituales, ingredientes y sets.
- Sprints 3–9: carrito comercial, checkout, pagos, cuenta, admin, SEO,
  analytics, auditoría y E2E según `docs/IMPLEMENTATION_PLAN.md`.
- Rutas 404/error globales y metadata dinámica más allá del catálogo.
- Datos reales de inventario, peso, ingredientes, políticas y proveedor de pago.

## Bloqueado

- Supabase Cloud: pendiente de confirmación de acceso Developer, `link`, dry-run
  y aplicación controlada de las 18 migraciones. No existe `.env.local` ni
  directorio de vínculo remoto.
- Las 42 pruebas RLS no pueden ejecutarse sin URL y clave pública del proyecto.
- Sunscreen: bloqueado por documentación regulatoria.
- Tónico Para Barba: claims y contenido pendientes; necesita packshot propio.
- Sets: composición y precio requieren confirmación para calcular ahorro real.
- Filtros de disponibilidad, promociones, novedades y más vendidos requieren
  stock, vigencias e histórico reales; no se simularán.

## Riesgos

1. El catálogo local muestra productos cuya publicación final depende de la
   revisión regulatoria; la fuente remota deberá aplicar `status = active`.
2. No hay inventario real: cualquier mensaje de disponibilidad sería falso.
3. No existen ingredientes completos, pesos ni políticas aprobadas.
4. El carrito actual es deliberadamente no transaccional; no puede alimentar un
   checkout hasta que el servidor recalcule precio, descuento y stock.
5. Las migraciones no se consideran verificadas hasta ejecutarse en el proyecto
   Cloud de desarrollo siguiendo el flujo no destructivo acordado.

## Línea base de QA

- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm run build`: correcto.
- Vitest: 23 pruebas unitarias correctas; suite RLS bloqueada por credenciales
  remotas ausentes, con 42 casos preparados.
