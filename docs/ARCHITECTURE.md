# ARCHITECTURE.md — Arquitectura del sistema

Plataforma de comercio electrónico propia para Gaviota by Lia.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS 4 ·
Supabase (PostgreSQL + Auth + Storage) · Zod · React Hook Form · Resend · Vitest ·
Playwright · Vercel

---

## 1. Principio rector

> **El navegador nunca decide nada comercial.**

Precios, descuentos, totales, disponibilidad, roles y estados de pedido se calculan y
verifican **siempre en el servidor**. El cliente envía intención (`productId`,
`variantId`, `quantity`, `couponCode`); el servidor decide el resultado.

Esto no es una preferencia de estilo: es la diferencia entre una tienda y una tienda que
puede ser vaciada por cualquiera con las herramientas de desarrollador abiertas.

---

## 2. Las cuatro áreas

```
┌──────────────────────────────────────────────────────────────┐
│  1. STOREFRONT PÚBLICO          2. ÁREA DEL CLIENTE          │
│     Server Components              Sesión Supabase           │
│     ISR + caché                    RLS por user_id           │
│     Sin datos sensibles            SSR sin caché             │
├──────────────────────────────────────────────────────────────┤
│  3. PANEL ADMIN                 4. SERVICIOS DE COMERCIO     │
│     Rol verificado en servidor     lib/commerce, orders,     │
│     Doble barrera (layout+action)  inventory, payments...    │
│     Auditoría de cada escritura    Sin dependencia de UI     │
└──────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │   SUPABASE POSTGRES   │
                │   RLS = última barrera│
                └───────────────────────┘
```

Las áreas 1–3 son capas de presentación. **Toda la lógica de negocio vive en el área 4**
(`src/lib/`), sin importar nada de React. Esto la hace testeable con Vitest sin montar
componentes, y reutilizable desde una Server Action, un Route Handler o una tarea cron.

---

## 3. Estructura de carpetas

```
src/
  app/
    (store)/            # Storefront público
      layout.tsx        # Header + Footer + AnnouncementBar
      page.tsx          # Home (19 secciones)
      shop/  categories/[slug]/  products/[slug]/
      kits/  routine/  ingredients/
      our-story/  founder/  journal/  faq/  contact/
      cart/  checkout/  order-confirmation/[token]/
      track-order/  search/
      (legal)/          # shipping-policy, refund-policy, privacy-policy, terms, cookies
    (auth)/             # login, register, forgot-password, reset-password
    account/            # Área privada del cliente
    admin/              # Panel administrativo
    api/                # Route Handlers
  components/
    layout/  store/  products/  cart/  checkout/
    account/  admin/  sections/  forms/  ui/
  lib/
    supabase/           # client.ts, server.ts, admin.ts, middleware.ts
    auth/               # session, roles, guards
    commerce/           # money, pricing, totals  ← núcleo
    cart/  catalog/  inventory/  orders/
    payments/           # provider.ts (interfaz), mock.ts, webhook.ts
    shipping/  email/  analytics/  seo/  security/  validations/
  types/                # database.ts (generado), domain.ts
  emails/               # Plantillas React Email
  tests/                # unit/ e2e/
supabase/
  migrations/           # SQL versionado
  seed/                 # Datos de desarrollo
```

**Regla que se aplica sin excepción:** ningún componente de `components/` importa
`@supabase/*` ni contiene cálculo de precios. Los componentes reciben datos ya calculados
y tipados. Esto es lo que impide que la lógica comercial acabe repartida por la interfaz —
el problema estructural que hace inmantenibles a las tiendas a medida.

---

## 4. Server Components por defecto

Client Components **solo** donde hay estado real de navegador:

| Componente | Motivo |
|---|---|
| `CartDrawer`, `CartItemQuantity` | Estado optimista + `aria-live` |
| `AddToCartButton`, `QuickAdd` | Estado de envío |
| `VariantSelector` | Cambia imagen y precio |
| `ProductGallery`, `ProductZoom` | Interacción táctil y teclado |
| `MobileMenu`, `SearchDialog` | Modales con foco atrapado |
| `NeedsSelector`, `RitualSteps` | Selección interactiva |
| Formularios (React Hook Form) | Validación en cliente |
| `AnnouncementBar` | Cierre persistente |
| `CookieConsent` | Consentimiento |

Todo lo demás —listados, fichas, secciones editoriales, tablas del admin— es Server
Component. El resultado: el JavaScript enviado al navegador es pequeño, que es la
condición para cumplir los objetivos de rendimiento en móvil.

**`RitualSteps` y `NeedsSelector`** se construyen con degradación: sin JavaScript, los
tres pasos se muestran apilados y cada opción es un enlace normal. La interactividad es
una mejora, no un requisito.

---

## 5. Clientes de Supabase — tres, y no se mezclan

| Cliente | Archivo | Clave | Dónde |
|---|---|---|---|
| Navegador | `supabase/client.ts` | `ANON_KEY` | Client Components |
| Servidor | `supabase/server.ts` | `ANON_KEY` + cookies | Server Components, Actions |
| Admin | `supabase/admin.ts` | **`SERVICE_ROLE_KEY`** | Solo servidor, uso excepcional |

El cliente admin **salta las políticas RLS**. Su uso se limita a: webhooks de pago,
tareas cron y operaciones administrativas que requieren escribir en varias tablas de
usuarios distintos.

`supabase/admin.ts` empieza con:
```ts
import 'server-only';
```
Si algún día un Client Component lo importa por error, **la compilación falla**. No queda
al criterio de quien revisa el código.

`SUPABASE_SERVICE_ROLE_KEY` no lleva prefijo `NEXT_PUBLIC_`. Nunca.

---

## 6. Autorización — tres barreras

```
1. middleware.ts    → refresca sesión, redirige /admin y /account sin sesión
2. layout / action  → verifica el ROL leyéndolo de la BASE DE DATOS
3. RLS              → la base de datos rechaza lo que no corresponda
```

**El rol nunca se lee de una cookie, del JWT del cliente ni de un campo enviado por el
navegador.** Se consulta `profiles.role` en cada petición que lo requiera.

El middleware **no autoriza**, solo redirige: es una mejora de experiencia, no un control
de seguridad. La barrera real es la 2, y la 3 es la red de seguridad.

Cada Server Action de administración empieza igual:

```ts
'use server';
export async function updateProduct(input: unknown) {
  const admin = await requireAdmin();          // 1. rol desde BD, lanza si no
  const data  = updateProductSchema.parse(input); // 2. Zod valida la forma
  // 3. lógica
  await logAudit({ actorId: admin.id, action: 'product.update', ... });
}
```

Una Server Action es un endpoint HTTP invocable directamente: proteger solo el `layout.tsx`
es insuficiente. Cada acción se protege por sí misma.

---

## 7. Flujo de checkout

```
Cliente                 Servidor                      Proveedor de pago
   │                        │                                │
   │ 1. POST checkout       │                                │
   │───────────────────────>│                                │
   │   {cartId, dirección}  │                                │
   │                        │ 2. Revalida carrito            │
   │                        │    · precios ACTUALES de BD    │
   │                        │    · variantes activas         │
   │                        │    · stock disponible          │
   │                        │    · cupón vigente             │
   │                        │ 3. Calcula totales EN SERVIDOR │
   │                        │ 4. RESERVA inventario (TX)     │
   │                        │ 5. Crea pedido pending_payment │
   │                        │ 6. Crea sesión de pago ────────>│
   │<───────────────────────│<───────────────────────────────│
   │ 7. Paga en el proveedor ───────────────────────────────>│
   │                        │                                │
   │                        │<──── 8. WEBHOOK FIRMADO ───────│
   │                        │ 9. Verifica firma              │
   │                        │10. ¿Evento ya procesado? → sale│
   │                        │11. Pedido → paid               │
   │                        │12. Reserva → salida definitiva │
   │                        │13. Correos (cliente + admin)   │
   │<── redirige a /order-confirmation/[token] ──────────────│
```

**Puntos donde este flujo protege el negocio:**

- **Paso 2.** El precio que llega del navegador se descarta. Si el carrito se creó hace
  tres días y el precio cambió, se usa el actual y se avisa al cliente.
- **Paso 4.** La reserva ocurre *antes* de crear el pedido. Si no hay stock, no hay pedido.
- **Paso 8.** El pedido pasa a `paid` **solo** por webhook. La redirección del paso 7 es
  cosmética: un usuario puede navegar a la URL de confirmación sin haber pagado, y el
  pedido seguirá en `pending_payment`.
- **Paso 10.** Los proveedores reintentan webhooks. Sin idempotencia, un pedido podría
  descontar stock dos veces.

---

## 8. Inventario y concurrencia

Todo cambio de stock pasa por una función PostgreSQL y **siempre** deja un
`inventory_movement`. No existe ninguna ruta que haga `UPDATE stock_quantity` directo.

```sql
create function reserve_inventory(p_variant_id uuid, p_quantity int, p_order_id uuid)
returns void language plpgsql security definer as $$
declare v_available int;
begin
  select stock_quantity - reserved_quantity into v_available
    from product_variants where id = p_variant_id
    for update;                                   -- bloqueo de fila

  if v_available < p_quantity then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  update product_variants
     set reserved_quantity = reserved_quantity + p_quantity
   where id = p_variant_id;

  insert into inventory_movements (...) values (..., 'reservation', ...);
end $$;
```

`FOR UPDATE` serializa a dos compradores simultáneos: el segundo espera y encuentra el
stock ya comprometido. Además, `CHECK (stock_quantity >= 0)` en la tabla garantiza que ni
un error de programación pueda dejar inventario negativo.

Las reservas expiran mediante `/api/cron/release-reservations` (Vercel Cron, protegido con
`CRON_SECRET`), que devuelve al stock las reservas de pedidos `pending_payment` caducados.

---

## 9. Pagos — desacoplados desde el primer día

```ts
export interface PaymentProvider {
  createPaymentSession(input: CreatePaymentInput): Promise<PaymentSession>;
  verifyPayment(reference: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  parseWebhook(rawBody: string, signature: string): Promise<PaymentWebhookEvent>;
}
```

`getPaymentProvider()` resuelve la implementación según `PAYMENT_PROVIDER`.
En el MVP: `MockPaymentProvider`, que simula éxito, fallo y webhook.

**Consecuencia práctica:** todo el MVP —incluidos los 16 pasos de la prueba E2E— se
desarrolla y valida sin conocer todavía la pasarela real. Cuando se decida, se implementa
una clase nueva y no cambia nada más. La decisión de pasarela (`PAYMENT_TODO.md`) no
bloquea el desarrollo.

`parseWebhook` recibe el **cuerpo crudo**, no el JSON parseado: la verificación de firma
se hace sobre los bytes exactos recibidos.

---

## 10. Dinero

**Se almacena en enteros: centavos.** `bigint` en PostgreSQL, `number` en TypeScript.

Nunca `float`. `0.1 + 0.2 !== 0.3` y en un total de pedido eso es un descuadre contable.

```ts
type Cents = number & { readonly __brand: 'Cents' };
```

El tipo marcado impide sumar centavos con un precio en unidades por descuido: el
compilador lo rechaza. La conversión y el formateo (`Intl.NumberFormat`) ocurren solo en
la capa de presentación.

`order_items` guarda **copia** de nombre, SKU y precio unitario en el momento de la compra.
Si el producto sube de precio o se archiva, el pedido histórico no cambia. Es la razón por
la que los productos se archivan y nunca se borran.

---

## 11. Carrito

| Situación | Identificación |
|---|---|
| Anónimo | `anonymous_session_id` en cookie `httpOnly`, 30 días |
| Autenticado | `user_id` |
| Inicia sesión con carrito anónimo | Se fusionan; cantidades se suman y se revalida stock |

El carrito vive en base de datos, no en `localStorage`: persiste entre dispositivos y
permite recalcular en servidor. Los precios mostrados en el carrito se leen siempre de la
base de datos, nunca de lo guardado en `cart_items`.

---

## 12. Contenido editable

`content_sections`, con clave `section_key`, alimenta el home y las páginas de marca.
Las 19 secciones del home leen de ahí.

```ts
const hero = await getContentSection('home.hero');
```

En desarrollo, si una clave no existe se usa un valor por defecto tipado.
**En producción, la sección no se renderiza** si no hay contenido o si su `status` no es
`active`. Así se cumple sin esfuerzo la regla de no publicar mocks ni secciones vacías: si
no hay testimonios, no hay bloque de testimonios.

Tras editar, se llama a `revalidateTag()` para que el cambio se vea sin desplegar.

---

## 13. Seguridad

| Medida | Implementación |
|---|---|
| RLS en todas las tablas | Activada por defecto; sin política = sin acceso |
| Validación | Zod en el límite de toda Server Action y Route Handler |
| Autorización | Rol desde BD en cada acción |
| Rate limiting | Por IP en contacto, newsletter, login, cupones |
| Webhooks | Firma verificada + `provider_event_id` único |
| CSP y cabeceras | `next.config.ts` + middleware |
| Sanitización | Todo HTML se sanitiza antes de guardar y de renderizar |
| Enumeración de pedidos | `public_token` aleatorio + verificación de correo |
| Secretos | Solo variables de entorno; `service_role` con `server-only` |
| Auditoría | Toda escritura administrativa en `audit_logs` |

**Sobre la enumeración de pedidos:** `order_number` (`GV-2026-000001`) es secuencial y
predecible, por lo que **no sirve como autorización**. El acceso público a un pedido
requiere `public_token` aleatorio, y `/track-order` exige además el correo del pedido.

---

## 14. Rendimiento

Objetivos: Lighthouse >90 / a11y >95 / LCP <2,5 s / CLS <0,1 / INP <200 ms.

| Medida | Detalle |
|---|---|
| Server Components | JavaScript mínimo en el cliente |
| `next/image` | AVIF/WebP, `sizes` explícito, `width`/`height` siempre → CLS 0 |
| `priority` | **Solo** en la imagen del hero |
| `next/font` | Dos familias, `display: swap`, autoalojadas |
| ISR | 60 s en catálogo, 300 s en contenido |
| Framer Motion | Importado dinámicamente solo donde se usa |
| Sin librerías pesadas | Sin lodash, moment ni carruseles de terceros |

**Riesgo específico de este proyecto:** las fotografías originales pesan entre 7 y 27 MB.
Se procesan en el pipeline de build a derivados servidos por `next/image`; los originales
se conservan pero **nunca se sirven**. Servir un JPEG de 27 MB haría inalcanzable
cualquier objetivo de LCP.

El feed de Instagram embebido se descarta por el mismo motivo (ver `SITEMAP.md` §6.1).

---

## 15. Accesibilidad — WCAG 2.2 AA

`lang="es"` (el sitio actual declara `en` en español), skip link, foco visible, jerarquía
de encabezados correcta, modales con foco atrapado y cierre con Escape, `aria-live` en el
carrito, objetivos táctiles ≥44 px, contraste verificado.

**`prefers-reduced-motion` no es opcional.** La dirección creativa pide parallax, zoom en
hover, transiciones y marquee; todo eso se desactiva en un `@media` global, y los
componentes interactivos siguen funcionando sin animación.

Sobre el contraste: el rosa intenso `#C85C80` sobre blanco da ~4,0:1, **por debajo del
mínimo 4,5:1** para texto normal. Por eso los botones primarios usan rosa profundo
`#9E3F60` (~7:1). Detallado en `DESIGN_DIRECTION.md`.

---

## 16. Pruebas

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarias | Vitest | Precios, cupones, totales, inventario, estados, moneda, número de pedido, idempotencia |
| Integración | Vitest + Supabase local | **Políticas RLS** |
| E2E | Playwright | Los 16 pasos del flujo completo con `MockPaymentProvider` |
| Contenido | Vitest | Que no haya `[INSERT`, `lorem`, `myshopify`, Unicode matemático ni claims prohibidos |

Las pruebas de RLS son las más importantes y las que más se olvidan: verifican que un
cliente A no puede leer el pedido de un cliente B **atacando directamente la base de
datos**, no a través de la interfaz.

---

## 17. Decisiones y su porqué

| Decisión | Motivo |
|---|---|
| Dinero en centavos enteros | Los float descuadran los totales |
| Lógica de negocio fuera de los componentes | Testeable sin montar React |
| `MockPaymentProvider` primero | El desarrollo no espera a la pasarela |
| RLS aunque ya se valide en servidor | Defensa en profundidad |
| Copia de nombre/SKU/precio en `order_items` | Los pedidos históricos son inmutables |
| Archivar, nunca borrar productos | Integridad de pedidos pasados |
| Carrito en BD, no en `localStorage` | Persistencia y recálculo en servidor |
| `content_sections` para el home | La propietaria edita sin desarrollo |
| Sección oculta si no hay datos | Impide publicar mocks o bloques vacíos |
| `server-only` en el cliente admin | Convierte un error de seguridad en error de compilación |
| Una sola moneda en el MVP | Multimoneda multiplica la complejidad sin necesidad probada |
