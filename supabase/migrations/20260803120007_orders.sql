-- =============================================================================
-- 0007_orders.sql — Pedidos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Número público de pedido: GV-2026-000001
-- -----------------------------------------------------------------------------
-- Se genera EXCLUSIVAMENTE en servidor, mediante secuencia: no hay condición de
-- carrera ni forma de que el cliente influya en él.
--
-- Es secuencial y por tanto predecible, así que NO AUTORIZA NADA. Sirve para que
-- la clienta lo mencione por teléfono. El acceso público a un pedido va por
-- `public_token` (32 bytes aleatorios).
-- -----------------------------------------------------------------------------
create sequence order_number_seq start 1;

create or replace function generate_order_number()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select 'GV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default generate_order_number(),
  public_token       text not null unique
                       default encode(extensions.gen_random_bytes(32), 'hex'),
  user_id            uuid references profiles (id) on delete set null,
  customer_email     extensions.citext not null,
  customer_phone     text,
  currency           char(3) not null default 'USD',

  -- Todos los importes en centavos.
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
  reservation_expires_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- LA RESTRICCIÓN MÁS VALIOSA DEL ESQUEMA.
  -- Ningún pedido puede existir con totales que no cuadren, venga el descuadre
  -- de un error de cálculo o de una manipulación. Es aritmética verificada por
  -- el motor, no por la aplicación.
  constraint totals_add_up
    check (grand_total = subtotal - discount_total + tax_total + shipping_total),

  -- El descuento no puede superar al subtotal.
  constraint discount_not_over_subtotal
    check (discount_total <= subtotal)
);

-- user_id es ON DELETE SET NULL: si una clienta borra su cuenta, el pedido
-- sobrevive (obligación contable) sin datos de cuenta asociados.

create index orders_user_idx   on orders (user_id, created_at desc);
create index orders_email_idx  on orders (customer_email);
create index orders_status_idx on orders (order_status, created_at desc);
create index orders_payment_status_idx on orders (payment_status);
create index orders_created_idx on orders (created_at desc);
create index orders_reservation_expiry_idx
  on orders (reservation_expires_at)
  where order_status = 'pending_payment';

comment on column orders.public_token is
  'Único mecanismo de acceso público a un pedido. 32 bytes aleatorios. '
  'order_number NO autoriza: es secuencial y predecible.';
comment on constraint totals_add_up on orders is
  'grand_total = subtotal - descuento + impuestos + envío. Verificado por el motor.';

-- FK diferida de inventory_movements (orders no existía en 0005).
alter table inventory_movements
  add constraint inventory_movements_order_fk
  foreign key (order_id) references orders (id) on delete set null;

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------
-- product_name, variant_name, sku y unit_price son COPIAS del momento de la
-- compra: desnormalización deliberada.
--
-- Si el producto cambia de precio, se renombra o se archiva, la factura
-- histórica no se altera. Por eso las FK son ON DELETE SET NULL: el pedido
-- sigue siendo legible aunque el producto desaparezca. Y por eso los productos
-- se archivan y nunca se borran.
-- -----------------------------------------------------------------------------
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders (id) on delete cascade,
  product_id     uuid references products (id) on delete set null,
  variant_id     uuid references product_variants (id) on delete set null,
  product_name   text   not null,          -- COPIA
  variant_name   text,                     -- COPIA
  sku            text,                     -- COPIA
  quantity       int    not null check (quantity > 0),
  unit_price     bigint not null check (unit_price >= 0),   -- COPIA
  discount_total bigint not null default 0 check (discount_total >= 0),
  line_total     bigint not null check (line_total >= 0),

  constraint line_total_correct
    check (line_total = unit_price * quantity - discount_total)
);

create index order_items_order_idx   on order_items (order_id);
create index order_items_product_idx on order_items (product_id);

comment on table order_items is
  'Guarda copia de nombre, SKU y precio. Los pedidos históricos son inmutables.';

-- -----------------------------------------------------------------------------
-- order_addresses
-- -----------------------------------------------------------------------------
create table order_addresses (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders (id) on delete cascade,
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

-- -----------------------------------------------------------------------------
-- order_status_history
-- -----------------------------------------------------------------------------
-- Cada cambio registra estado anterior, nuevo, responsable, fecha y nota.
-- Se alimenta con un trigger (0017), no con lógica de aplicación que pueda
-- olvidarse en alguna ruta.
-- -----------------------------------------------------------------------------
create table order_status_history (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders (id) on delete cascade,
  previous_status order_status,
  new_status      order_status not null,
  note            text,
  changed_by      uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index order_status_history_order_idx
  on order_status_history (order_id, created_at desc);
