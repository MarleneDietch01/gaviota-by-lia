-- =============================================================================
-- 0006_carts.sql — Carrito persistente
-- =============================================================================
-- El carrito vive en base de datos, no en localStorage: persiste entre
-- dispositivos y permite recalcular todo en servidor.
-- =============================================================================

create table carts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles (id) on delete cascade,
  anonymous_session_id text,
  status               cart_status not null default 'active',
  expires_at           timestamptz not null default (now() + interval '30 days'),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Un carrito pertenece a un usuario o a una sesión anónima. Nunca a nadie.
  constraint cart_has_owner
    check (user_id is not null or anonymous_session_id is not null)
);

-- Un solo carrito activo por usuario autenticado.
create unique index carts_active_user
  on carts (user_id)
  where status = 'active' and user_id is not null;

-- Un solo carrito activo por sesión anónima.
create unique index carts_active_anonymous
  on carts (anonymous_session_id)
  where status = 'active' and anonymous_session_id is not null;

create index carts_expiry_idx on carts (expires_at) where status = 'active';

-- -----------------------------------------------------------------------------
-- cart_items
-- -----------------------------------------------------------------------------
-- NO guarda precio. Es deliberado.
--
-- El precio se lee siempre de product_variants en el momento de mostrar o de
-- cobrar. Un precio congelado en el carrito es exactamente el vector que
-- permitiría comprar a un precio antiguo: basta con dejar el carrito abierto
-- antes de una subida de precio.
-- -----------------------------------------------------------------------------
create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid not null references product_variants (id) on delete cascade,
  quantity   int not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sin líneas duplicadas: añadir de nuevo incrementa la cantidad.
  unique (cart_id, variant_id)
);

create index cart_items_cart_idx on cart_items (cart_id);

comment on table cart_items is
  'No almacena precio: se lee siempre de product_variants para impedir la '
  'compra a un precio obsoleto.';
