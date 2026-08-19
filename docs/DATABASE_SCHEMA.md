# DATABASE_SCHEMA.md — Esquema de base de datos

PostgreSQL sobre Supabase. Migraciones SQL versionadas en `supabase/migrations/`.

**Convenciones**

- Identificadores `uuid` con `gen_random_uuid()`
- **Dinero: `bigint` en centavos.** Nunca `float`, nunca `numeric` para importes
- `timestamptz` siempre, nunca `timestamp`
- `created_at` / `updated_at` en toda tabla mutable, con trigger
- Snake case; tablas en plural
- **RLS activado en todas las tablas.** Sin política = sin acceso

---

## 1. Tipos enumerados

```sql
create type user_role         as enum ('customer','admin','super_admin');
create type user_status       as enum ('active','suspended');
create type entity_status     as enum ('draft','active','archived');
create type order_status      as enum ('pending_payment','paid','processing',
                                       'ready_to_ship','shipped','delivered',
                                       'cancelled','refunded','partially_refunded');
create type fulfillment_status as enum ('unfulfilled','preparing','ready',
                                       'shipped','delivered','returned');
create type payment_status    as enum ('pending','authorized','paid','failed',
                                       'cancelled','refunded','partially_refunded');
create type movement_type     as enum ('initial','purchase','adjustment','sale',
                                       'cancellation','refund','return',
                                       'reservation','reservation_release');
create type discount_type     as enum ('percentage','fixed');
create type cart_status       as enum ('active','converted','abandoned','expired');
create type address_type      as enum ('shipping','billing');
create type review_status     as enum ('pending','approved','rejected');
```

Los enum del motor impiden estados inválidos a nivel de base de datos. Un `text` con
convención se corrompe en cuanto alguien escribe `'Paid'`.

---

## 2. Usuarios y direcciones

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       citext not null,
  phone       text,
  role        user_role   not null default 'customer',
  status      user_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index profiles_email_key on profiles (email);
```

`profiles.role` es **la única fuente de verdad del rol**. No se copia al JWT ni a ninguna
cookie: se consulta en cada petición que lo requiera. Un rol dentro del token es un rol
que el cliente puede intentar manipular y que además queda obsoleto al degradar a alguien.

```sql
create table addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  label          text,
  recipient_name text not null,
  phone          text,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text,
  postal_code    text,
  country        char(2) not null,            -- ISO 3166-1 alpha-2
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index addresses_user_id_idx on addresses (user_id);
create unique index addresses_one_default_per_user
  on addresses (user_id) where is_default;
```

El índice único parcial garantiza **una sola dirección predeterminada por usuario**, sin
lógica de aplicación que pueda fallar.

---

## 3. Catálogo

```sql
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_path  text,
  status      entity_status not null default 'draft',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table products (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  short_description  text,
  description        text,
  sku                text unique,
  base_price         bigint not null check (base_price >= 0),      -- centavos
  compare_at_price   bigint check (compare_at_price >= 0),
  compare_at_starts_at timestamptz,
  compare_at_ends_at   timestamptz,
  cost_price         bigint check (cost_price >= 0),
  status             entity_status not null default 'draft',
  featured           boolean not null default false,
  category_id        uuid references categories(id) on delete set null,
  track_inventory    boolean not null default true,
  weight_grams       int check (weight_grams >= 0),
  ingredients_text   text,
  usage_instructions text,
  precautions        text,
  skin_type          text[],
  requires_disclaimer boolean not null default true,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint compare_at_price_higher
    check (compare_at_price is null or compare_at_price > base_price),
  constraint compare_at_needs_dates
    check (compare_at_price is null
           or (compare_at_starts_at is not null and compare_at_ends_at is not null))
);
create index products_status_idx   on products (status) where status = 'active';
create index products_category_idx on products (category_id);
create index products_featured_idx on products (featured) where featured;
```

**Tres restricciones que responden a hallazgos concretos de la auditoría:**

1. `compare_at_needs_dates` — hoy los 8 productos tienen precio anterior permanente. Esta
   restricción **hace imposible** repetirlo: un precio anterior sin fechas de vigencia es
   rechazado por la base de datos. El `%` de ahorro solo se muestra dentro de la ventana.
2. `compare_at_price_higher` — impide un "descuento" con precio anterior más bajo.
3. `requires_disclaimer` — activa el aviso *"Este producto es cosmético y no sustituye la
   evaluación de un profesional de la salud"* en la ficha. Por defecto `true`: hay que
   desactivarlo a propósito, no recordar activarlo.

```sql
create table product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  name                text not null,                    -- '115 mL', '236 mL'
  sku                 text unique,
  price               bigint not null check (price >= 0),
  compare_at_price    bigint check (compare_at_price >= 0),
  stock_quantity      int not null default 0 check (stock_quantity >= 0),
  reserved_quantity   int not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold int not null default 5,
  weight_grams        int check (weight_grams >= 0),
  status              entity_status not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint reserved_not_over_stock check (reserved_quantity <= stock_quantity)
);
create index product_variants_product_idx on product_variants (product_id);
```

`stock_quantity >= 0` y `reserved_quantity <= stock_quantity` son la garantía final contra
el inventario negativo y contra reservar más de lo que existe: **aunque falle toda la
lógica de aplicación, la base de datos rechaza la operación**.

Todos los productos actuales tienen una sola presentación, pero los envases reales sí
tienen tamaños distintos (2 oz, 4 oz, 8 oz). El modelo con variantes evita rehacer el
esquema cuando se añada un segundo tamaño.

```sql
create table product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  variant_id   uuid references product_variants(id) on delete set null,
  storage_path text not null,
  alt_text     text not null,          -- NOT NULL: accesibilidad obligatoria
  width        int  not null,
  height       int  not null,          -- evitan layout shift en next/image
  focal_x      numeric(4,3) default 0.5,
  focal_y      numeric(4,3) default 0.5,
  sort_order   int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);
create unique index product_images_one_primary
  on product_images (product_id) where is_primary;
```

`alt_text` es `NOT NULL`: **no se puede subir una imagen sin texto alternativo.** Hoy
ninguna imagen del sitio tiene alt descriptivo.

`focal_x`/`focal_y` resuelven el problema de que todas las fotografías sean verticales
4:5: cada recorte responsivo respeta el punto focal en lugar de centrar a ciegas y cortar
caras o productos.

```sql
create table product_related (
  product_id  uuid not null references products(id) on delete cascade,
  related_id  uuid not null references products(id) on delete cascade,
  relation    text not null default 'complementary',  -- 'complementary' | 'similar'
  sort_order  int not null default 0,
  primary key (product_id, related_id, relation),
  constraint no_self_relation check (product_id <> related_id)
);
```

---

## 4. Inventario

```sql
create table inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id),
  variant_id        uuid not null references product_variants(id),
  movement_type     movement_type not null,
  quantity          int not null,                -- negativo = salida
  previous_quantity int not null,
  new_quantity      int not null,
  reason            text,
  order_id          uuid references orders(id) on delete set null,
  created_by        uuid references profiles(id),
  created_at        timestamptz not null default now()
);
create index inventory_movements_variant_idx on inventory_movements (variant_id, created_at desc);
```

Libro mayor **inmutable**: sin `UPDATE` ni `DELETE` en RLS. Un error se corrige con un
movimiento de ajuste, nunca editando el histórico. Guarda cantidad anterior y nueva, de
modo que el stock es siempre auditable y reconstruible.

**No existe ninguna ruta que modifique `stock_quantity` sin insertar aquí**: ambas
operaciones ocurren dentro de la misma función PostgreSQL y de la misma transacción.

---

## 5. Carrito

```sql
create table carts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles(id) on delete cascade,
  anonymous_session_id text,
  status               cart_status not null default 'active',
  expires_at           timestamptz not null default now() + interval '30 days',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint cart_has_owner
    check (user_id is not null or anonymous_session_id is not null)
);
create unique index carts_active_user on carts (user_id)
  where status = 'active' and user_id is not null;

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references product_variants(id),
  quantity   int  not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
```

**`cart_items` no guarda precio.** Es deliberado: el precio se lee siempre de
`product_variants` en el momento de mostrar o cobrar. Un precio congelado en el carrito es
exactamente el vector que permite comprar a un precio antiguo.

`unique (cart_id, variant_id)` evita líneas duplicadas: añadir de nuevo incrementa la
cantidad.

---

## 6. Pedidos

```sql
create table orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,        -- GV-2026-000001
  public_token       text not null unique default encode(gen_random_bytes(32),'hex'),
  user_id            uuid references profiles(id) on delete set null,
  customer_email     citext not null,
  customer_phone     text,
  currency           char(3) not null default 'USD',
  subtotal           bigint not null check (subtotal       >= 0),
  discount_total     bigint not null default 0 check (discount_total >= 0),
  tax_total          bigint not null default 0 check (tax_total      >= 0),
  shipping_total     bigint not null default 0 check (shipping_total >= 0),
  grand_total        bigint not null check (grand_total >= 0),
  payment_status     payment_status     not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  order_status       order_status       not null default 'pending_payment',
  customer_notes     text,
  internal_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint totals_add_up
    check (grand_total = subtotal - discount_total + tax_total + shipping_total)
);
create index orders_user_idx    on orders (user_id, created_at desc);
create index orders_email_idx   on orders (customer_email);
create index orders_status_idx  on orders (order_status, created_at desc);
```

**`totals_add_up` es la restricción más valiosa de todo el esquema.** Ningún pedido puede
existir con totales que no cuadren, venga el descuadre de un error de cálculo o de una
manipulación. Es aritmética verificada por el motor, no por la aplicación.

`user_id` es `on delete set null`: si un cliente borra su cuenta, el pedido sobrevive
(obligación contable) sin datos de cuenta asociados.

**`public_token`** —32 bytes aleatorios— es el único mecanismo de acceso público a un
pedido. `order_number` es secuencial y **no autoriza nada**: sirve para que el cliente lo
mencione por teléfono, no para consultar.

### Generación del número de pedido

```sql
create sequence order_number_seq;

create function generate_order_number() returns text
language sql as $$
  select 'GV-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('order_number_seq')::text, 6, '0');
$$;
```

Solo en servidor, mediante secuencia: no hay condición de carrera ni forma de que el
cliente influya en él.

```sql
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  product_id     uuid references products(id) on delete set null,
  variant_id     uuid references product_variants(id) on delete set null,
  product_name   text   not null,      -- COPIA en el momento de la compra
  variant_name   text,                 -- COPIA
  sku            text,                 -- COPIA
  quantity       int    not null check (quantity > 0),
  unit_price     bigint not null check (unit_price >= 0),   -- COPIA
  discount_total bigint not null default 0,
  line_total     bigint not null,
  constraint line_total_correct
    check (line_total = unit_price * quantity - discount_total)
);
```

Los cuatro campos marcados como COPIA son **desnormalización deliberada**. Si el producto
cambia de precio, se renombra o se archiva, la factura histórica no se altera. Por eso las
claves foráneas son `on delete set null`: el pedido sigue siendo legible aunque el producto
desaparezca.

```sql
create table order_addresses (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  address_type   address_type not null,
  recipient_name text not null,
  phone          text,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text,
  postal_code    text,
  country        char(2) not null,
  unique (order_id, address_type)
);

create table order_status_history (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  previous_status order_status,
  new_status      order_status not null,
  note            text,
  changed_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);
```

`order_status_history` cubre el requisito de registrar estado anterior, nuevo, responsable,
fecha y nota en cada cambio.

---

## 7. Pagos

```sql
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  provider            text not null,
  provider_payment_id text,
  idempotency_key     text not null unique,
  amount              bigint not null check (amount > 0),
  currency            char(3) not null,
  status              payment_status not null default 'pending',
  payment_method      text,              -- 'visa ****4242' — NUNCA el número completo
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table payment_events (
  id                uuid primary key default gen_random_uuid(),
  payment_id        uuid references payments(id) on delete cascade,
  provider_event_id text not null,
  event_type        text not null,
  payload_hash      text not null,
  processing_status text not null default 'pending',
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (provider, provider_event_id)
);
```

**`unique (provider, provider_event_id)` es lo que hace idempotente el webhook.** Los
proveedores reintentan ante cualquier duda; sin esta restricción, un reintento descontaría
inventario dos veces y enviaría dos correos. El manejador intenta insertar primero: si
choca con la clave única, el evento ya se procesó y se responde 200 sin hacer nada.

Se guarda `payload_hash`, no el payload completo: permite detectar manipulación sin
almacenar datos de pago innecesarios.

**Nunca se almacena** número completo de tarjeta, CVV ni fecha de caducidad. `payment_method`
guarda como mucho marca y últimos cuatro dígitos, tal como los devuelve el proveedor.

---

## 8. Envíos

```sql
create table shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  carrier         text,
  tracking_number text,
  tracking_url    text,
  status          text not null default 'pending',
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table shipping_rates (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,      -- 'USPS Priority Mail'
  country             char(2) not null,
  state               text,               -- null = todo el país
  rate                bigint not null check (rate >= 0),
  free_above          bigint check (free_above >= 0),
  estimated_days_min  int,
  estimated_days_max  int,
  is_local_pickup     boolean not null default false,
  status              entity_status not null default 'active',
  sort_order          int not null default 0
);
```

`shipping_rates` es editable desde el panel: cubre tarifa plana, umbral de envío gratis
(necesario para la barra de progreso hacia envío gratuito) y recogida local, sin código.

Los tiempos estimados por defecto salen de la política actual, que sí tiene datos reales:
2 días de proceso + 3–4 de entrega con USPS Priority Mail.

---

## 9. Cupones

```sql
create table coupons (
  id               uuid primary key default gen_random_uuid(),
  code             citext not null unique,
  discount_type    discount_type not null,
  discount_value   bigint not null check (discount_value > 0),
  minimum_amount   bigint check (minimum_amount >= 0),
  maximum_discount bigint check (maximum_discount >= 0),
  usage_limit      int check (usage_limit > 0),
  usage_count      int not null default 0 check (usage_count >= 0),
  per_user_limit   int check (per_user_limit > 0),
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz,
  status           entity_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint percentage_max_100
    check (discount_type <> 'percentage' or discount_value <= 10000),  -- 100.00 %
  constraint expires_after_start
    check (expires_at is null or expires_at > starts_at)
);

create table coupon_redemptions (
  id                uuid primary key default gen_random_uuid(),
  coupon_id         uuid not null references coupons(id) on delete cascade,
  order_id          uuid not null references orders(id) on delete cascade,
  user_id           uuid references profiles(id) on delete set null,
  amount_discounted bigint not null check (amount_discounted >= 0),
  created_at        timestamptz not null default now(),
  unique (coupon_id, order_id)
);
```

`code` es `citext`: `BIENVENIDA10` y `bienvenida10` son el mismo cupón, como espera
cualquier cliente. `percentage_max_100` impide el descuento del 150 % por error de tecleo.
Los porcentajes se guardan en centésimas de punto (`1000` = 10,00 %) para no usar decimales.

---

## 10. Favoritos y reseñas

```sql
create table favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  user_id           uuid references profiles(id) on delete set null,
  order_id          uuid references orders(id) on delete set null,
  rating            int  not null check (rating between 1 and 5),
  title             text,
  content           text,
  status            review_status not null default 'pending',
  verified_purchase boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_approved_idx
  on reviews (product_id) where status = 'approved';
```

`status` por defecto `'pending'`: **ninguna reseña se publica sin moderación**.
`verified_purchase` solo se marca `true` desde el servidor, comprobando que existe un
pedido `delivered` de ese usuario con ese producto.

**La tabla arranca vacía.** El sitio actual no tiene ni una sola reseña, así que en el
lanzamiento no habrá estrellas, ni valoración media, ni `AggregateRating` en los datos
estructurados. Las consultas devolverán `count = 0` y los componentes correspondientes
sencillamente no se renderizarán.

---

## 11. Contenido editable

```sql
create table content_sections (
  id           uuid primary key default gen_random_uuid(),
  section_key  text not null unique,     -- 'home.hero', 'home.campaign'
  title        text,
  subtitle     text,
  body         text,
  image_path   text,
  image_alt    text,
  button_label text,
  button_url   text,
  settings     jsonb not null default '{}'::jsonb,
  status       entity_status not null default 'draft',
  sort_order   int not null default 0,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz not null default now()
);

create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text,
  status     entity_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table site_settings (
  id            uuid primary key default gen_random_uuid(),
  setting_key   text not null unique,
  setting_value jsonb not null,
  updated_by    uuid references profiles(id),
  updated_at    timestamptz not null default now()
);
```

Claves de `content_sections` previstas (una por sección del home, más las páginas de marca):

```
home.announcement   home.hero            home.trust        home.bestsellers
home.needs          home.campaign        home.ritual       home.hero_product
home.story          home.kits            home.community    home.testimonials
home.ugc            home.benefits        home.instagram    home.newsletter
page.our_story      page.founder         page.ingredients  page.routine
legal.shipping      legal.refund         legal.privacy     legal.terms
legal.cookies       footer.about         contact.info
```

`status = 'draft'` en las secciones sin datos reales (testimonios, UGC) hace que **no se
rendericen en producción** sin necesidad de tocar código.

---

## 12. Comunicaciones y auditoría

```sql
create table newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null unique,
  status          text not null default 'subscribed',
  source          text,
  unsubscribe_token text not null default encode(gen_random_bytes(24),'hex'),
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        citext not null,
  phone        text,
  subject      text,
  order_number text,
  message      text not null,
  status       text not null default 'new',
  ip_hash      text,                    -- hash, no la IP: minimización de datos
  created_at   timestamptz not null default now()
);

create table email_log (
  id          uuid primary key default gen_random_uuid(),
  to_email    citext not null,
  template    text not null,
  order_id    uuid references orders(id) on delete set null,
  provider_id text,
  status      text not null default 'sent',
  error       text,
  created_at  timestamptz not null default now()
);

create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references profiles(id) on delete set null,
  action        text not null,           -- 'product.update', 'order.status_change'
  entity_type   text not null,
  entity_id     uuid,
  previous_data jsonb,
  new_data      jsonb,
  ip_hash       text,
  created_at    timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id, created_at desc);
```

`audit_logs` guarda el estado anterior completo en `previous_data`: **cualquier cambio
administrativo es reversible**. Es la red de seguridad para una propietaria no técnica que
aprende a usar el panel.

`email_log` permite reenviar manualmente una confirmación desde el panel, lo que importa
especialmente dada la migración del correo transaccional a dominio propio.

Se almacena `ip_hash`, no la IP: suficiente para limitar abuso, sin guardar un dato
personal innecesario.

---

## 13. Políticas RLS

Patrón aplicado en toda tabla:

```sql
alter table <tabla> enable row level security;
```

Función auxiliar, evaluada contra la base de datos:

```sql
create function is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
     where id = auth.uid() and role in ('admin','super_admin')
       and status = 'active'
  );
$$;
```

### Resumen de políticas

| Tabla | Cliente | Administrador |
|---|---|---|
| `profiles` | Lee y edita **el suyo**. No puede cambiar `role` ni `status` | Todo |
| `addresses` | CRUD de las suyas (`user_id = auth.uid()`) | Lectura |
| `categories`, `products`, `product_variants`, `product_images` | Lectura solo si `status = 'active'` | CRUD |
| `carts`, `cart_items` | Solo el suyo (por `user_id` o sesión anónima) | Lectura |
| `orders` | Lectura de los suyos. **Sin `INSERT`/`UPDATE`** | Todo |
| `order_items`, `order_addresses` | Lectura vía pedido propio | Todo |
| `payments`, `payment_events` | **Ningún acceso** | Lectura |
| `inventory_movements` | **Ningún acceso** | Lectura + inserción |
| `coupons` | **Ningún acceso directo** (validación en servidor) | CRUD |
| `favorites` | CRUD de los suyos | Lectura |
| `reviews` | Lee `approved`; crea las suyas con compra verificada | CRUD + moderación |
| `content_sections`, `faqs` | Lectura solo si `status = 'active'` | CRUD |
| `site_settings` | **Ningún acceso** | CRUD |
| `audit_logs` | **Ningún acceso** | Lectura (`super_admin`) |
| `newsletter_subscribers`, `contact_messages` | **Ningún acceso** | Lectura |

**Los clientes no tienen `INSERT` ni `UPDATE` sobre `orders`.** Los pedidos se crean
exclusivamente mediante Server Actions con el cliente de servicio, tras recalcular todos
los importes. Es la aplicación estricta de "un cliente no puede modificar totales ni
cambiar estados de pedidos".

Un usuario anónimo no tiene ninguna política de lectura sobre `orders`: el acceso público
va por `public_token`, verificado en servidor, nunca por RLS.

**Estas políticas se prueban.** `tests/unit/rls.test.ts` ataca la base de datos
directamente con la clave anónima e intenta, entre otras cosas: leer el pedido de otro
usuario, escalar el propio rol a `admin`, modificar `stock_quantity` y leer `payments`.
Todas deben fallar.

---

## 14. Funciones de comercio

| Función | Propósito |
|---|---|
| `generate_order_number()` | Número secuencial `GV-YYYY-NNNNNN` |
| `reserve_inventory(variant, qty, order)` | Reserva con `FOR UPDATE`; lanza `INSUFFICIENT_STOCK` |
| `release_reservation(order_id)` | Devuelve al stock las reservas de un pedido |
| `commit_inventory_sale(order_id)` | Reserva → salida definitiva al confirmarse el pago |
| `expire_stale_reservations()` | Libera reservas caducadas (llamada por cron) |
| `apply_coupon(cart, code, user)` | Valida vigencia, límites y mínimo; devuelve descuento |
| `is_admin()` | Comprobación de rol para RLS |

Todas son `security definer` con `search_path` fijado, y todas las que tocan inventario
insertan su `inventory_movement` en la misma transacción.

---

## 15. Índices

Además de los ya declarados:

```sql
create index products_search_idx on products
  using gin (to_tsvector('spanish', name || ' ' || coalesce(short_description,'')));
create index orders_created_idx        on orders (created_at desc);
create index order_items_order_idx     on order_items (order_id);
create index cart_items_cart_idx       on cart_items (cart_id);
create index coupon_redemptions_user_idx on coupon_redemptions (user_id);
create index low_stock_idx on product_variants (stock_quantity)
  where stock_quantity <= low_stock_threshold;
```

El índice de búsqueda usa el diccionario **`'spanish'`**, no `'english'`: el sitio es en
español y necesita lematizar correctamente ("hidratante"/"hidratación").

`low_stock_idx` es parcial: sirve al panel de bajo inventario sin recorrer toda la tabla.

---

## 16. Orden de migraciones

```
0001_extensions.sql          citext, pgcrypto
0002_enums.sql
0003_profiles_addresses.sql  + trigger de alta desde auth.users
0004_catalog.sql             categories, products, variants, images, related
0005_inventory.sql
0006_carts.sql
0007_orders.sql              + secuencia y generate_order_number()
0008_payments.sql
0009_shipping.sql
0010_coupons.sql
0011_favorites_reviews.sql
0012_content.sql
0013_communications_audit.sql
0014_functions.sql           comercio e inventario
0015_rls_policies.sql        RLS de todas las tablas
0016_indexes.sql
0017_triggers.sql            updated_at, auditoría, historial de estados
```

`seed/dev.sql` carga los datos de desarrollo (los 7 productos publicables, con contenido
marcado como provisional). **No se ejecuta nunca en producción**, y así se declara
explícitamente en el archivo.

---

## 17. Cómo el esquema responde a la auditoría

| Hallazgo | Respuesta en el esquema |
|---|---|
| Descuento permanente en 8/8 productos | `compare_at_needs_dates` lo hace imposible |
| Sin SKU | `products.sku` y `product_variants.sku` únicos |
| Sin peso | `weight_grams` en producto y variante |
| Sin ingredientes ni precauciones | `ingredients_text`, `precautions`, `usage_instructions` |
| Claims de medicamento | `requires_disclaimer` por defecto `true` |
| Imágenes sin texto alternativo | `alt_text NOT NULL` |
| Todas las fotos verticales 4:5 | `focal_x` / `focal_y` para recortes responsivos |
| Sin reseñas | Tabla lista y vacía; los componentes no renderizan con `count = 0` |
| Pedidos enumerables | `public_token` aleatorio, `order_number` sin valor de autorización |
| Sin inventario | Libro mayor inmutable + `CHECK (stock_quantity >= 0)` |
| Contenido quemado en el código | `content_sections` + `faqs` + `site_settings` |
| Sin trazabilidad de cambios | `audit_logs` con estado anterior completo |
