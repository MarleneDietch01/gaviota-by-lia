-- =============================================================================
-- 0004_catalog.sql — Catálogo: categorías, productos, variantes, imágenes
-- =============================================================================
-- DINERO: bigint en centavos. Nunca float, nunca numeric para importes.
-- 0.1 + 0.2 <> 0.3 en coma flotante, y en un total de pedido eso es un
-- descuadre contable real.
-- =============================================================================

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_path  text,
  status      entity_status not null default 'draft',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index categories_status_idx on categories (status, sort_order);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table products (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  short_description    text,
  description          text,
  sku                  text unique,
  base_price           bigint not null check (base_price >= 0),   -- centavos
  compare_at_price     bigint check (compare_at_price >= 0),
  compare_at_starts_at timestamptz,
  compare_at_ends_at   timestamptz,
  cost_price           bigint check (cost_price >= 0),
  status               entity_status not null default 'draft',
  featured             boolean not null default false,
  category_id          uuid references categories (id) on delete set null,
  track_inventory      boolean not null default true,
  weight_grams         int check (weight_grams >= 0),
  size_label           text,                                       -- '115 mL'
  ingredients_text     text,
  usage_instructions   text,
  precautions          text,
  skin_type            text[],
  requires_disclaimer  boolean not null default true,
  seo_title            text,
  seo_description      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  -- Un "precio anterior" tiene que ser mayor que el precio actual.
  -- Impide el descuento con precio anterior más bajo.
  constraint compare_at_price_higher
    check (compare_at_price is null or compare_at_price > base_price),

  -- HALLAZGO DE AUDITORÍA: los 8 productos del sitio actual llevan más de dos
  -- años con `compare_at_price` activo de forma permanente. No es una promoción,
  -- es el estado por defecto, y anunciar un precio anterior que nunca fue el de
  -- venta habitual es publicidad engañosa.
  --
  -- Esta restricción HACE IMPOSIBLE repetirlo: un precio anterior sin ventana
  -- de vigencia es rechazado por la base de datos.
  constraint compare_at_needs_dates
    check (
      compare_at_price is null
      or (compare_at_starts_at is not null and compare_at_ends_at is not null)
    ),

  constraint compare_at_dates_ordered
    check (
      compare_at_ends_at is null
      or compare_at_starts_at is null
      or compare_at_ends_at > compare_at_starts_at
    )
);

create index products_status_idx   on products (status) where status = 'active';
create index products_category_idx on products (category_id);
create index products_featured_idx on products (featured)
  where featured and status = 'active';

comment on constraint compare_at_needs_dates on products is
  'Un precio anterior exige ventana de vigencia. Impide el descuento perpetuo '
  'detectado en la auditoría del sitio Shopify.';
comment on column products.requires_disclaimer is
  'Activa el aviso cosmético en la ficha. Por defecto true: hay que desactivarlo '
  'a propósito, no recordar activarlo.';

-- -----------------------------------------------------------------------------
-- product_variants
-- -----------------------------------------------------------------------------
create table product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products (id) on delete cascade,
  name                text not null,                      -- '115 mL', '236 mL'
  sku                 text unique,
  price               bigint not null check (price >= 0),
  compare_at_price    bigint check (compare_at_price >= 0),
  stock_quantity      int not null default 0 check (stock_quantity >= 0),
  reserved_quantity   int not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  weight_grams        int check (weight_grams >= 0),
  status              entity_status not null default 'active',
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Garantía final contra el inventario negativo. Aunque falle toda la lógica
  -- de aplicación, el motor rechaza la operación.
  constraint reserved_not_over_stock
    check (reserved_quantity <= stock_quantity)
);

create index product_variants_product_idx on product_variants (product_id, sort_order);

comment on column product_variants.reserved_quantity is
  'Unidades comprometidas por pedidos pending_payment. El stock disponible real '
  'es stock_quantity - reserved_quantity.';

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------
-- alt_text es NOT NULL: no se puede subir una imagen sin texto alternativo.
-- Ninguna imagen del sitio actual lo tiene.
--
-- focal_x / focal_y resuelven un problema concreto de este proyecto: las 17
-- fotografías profesionales son TODAS 4:5 vertical. Sin punto focal, un recorte
-- responsivo centrado corta cabezas en las fotos de grupo (9, 11, 17, 18).
-- -----------------------------------------------------------------------------
create table product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products (id) on delete cascade,
  variant_id   uuid references product_variants (id) on delete set null,
  storage_path text not null,
  alt_text     text not null check (length(trim(alt_text)) > 0),
  width        int not null check (width > 0),
  height       int not null check (height > 0),
  focal_x      numeric(4, 3) not null default 0.5 check (focal_x between 0 and 1),
  focal_y      numeric(4, 3) not null default 0.5 check (focal_y between 0 and 1),
  sort_order   int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index product_images_product_idx on product_images (product_id, sort_order);

create unique index product_images_one_primary
  on product_images (product_id)
  where is_primary;

comment on column product_images.alt_text is
  'Obligatorio. Describe lo que se ve, sin repetir el nombre del producto ni '
  'añadir palabras clave: es texto para quien no puede ver la imagen.';

-- -----------------------------------------------------------------------------
-- product_related — complementarios y similares
-- -----------------------------------------------------------------------------
create table product_related (
  product_id uuid not null references products (id) on delete cascade,
  related_id uuid not null references products (id) on delete cascade,
  relation   text not null default 'complementary',
  sort_order int not null default 0,

  primary key (product_id, related_id, relation),
  constraint no_self_relation check (product_id <> related_id),
  constraint relation_known check (relation in ('complementary', 'similar'))
);
