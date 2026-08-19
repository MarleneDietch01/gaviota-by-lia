-- =============================================================================
-- 0010_coupons.sql — Cupones
-- =============================================================================
-- Los porcentajes se guardan en centésimas de punto: 1000 = 10,00 %.
-- Igual que el dinero, se evitan los decimales en coma flotante.
-- =============================================================================

create table coupons (
  id               uuid primary key default gen_random_uuid(),
  code             extensions.citext not null unique,
  description      text,
  discount_type    discount_type not null,
  discount_value   bigint not null check (discount_value > 0),
  minimum_amount   bigint check (minimum_amount >= 0),   -- centavos
  maximum_discount bigint check (maximum_discount > 0),  -- centavos
  usage_limit      int check (usage_limit > 0),
  usage_count      int not null default 0 check (usage_count >= 0),
  per_user_limit   int check (per_user_limit > 0),
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz,
  status           entity_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Impide el descuento del 150 % por un error de tecleo.
  constraint percentage_max_100
    check (discount_type <> 'percentage' or discount_value <= 10000),

  constraint expires_after_start
    check (expires_at is null or expires_at > starts_at),

  constraint usage_within_limit
    check (usage_limit is null or usage_count <= usage_limit),

  constraint code_format
    check (code ~ '^[A-Za-z0-9_-]{3,32}$')
);

create index coupons_active_idx on coupons (status, starts_at, expires_at)
  where status = 'active';

-- code es citext: BIENVENIDA10 y bienvenida10 son el mismo cupón, como espera
-- cualquier clienta que lo teclee desde el móvil.

comment on column coupons.discount_value is
  'Si es percentage, centésimas de punto (1000 = 10,00 %). Si es fixed, centavos.';

-- -----------------------------------------------------------------------------
-- coupon_redemptions
-- -----------------------------------------------------------------------------
create table coupon_redemptions (
  id                uuid primary key default gen_random_uuid(),
  coupon_id         uuid not null references coupons (id) on delete cascade,
  order_id          uuid not null references orders (id) on delete cascade,
  user_id           uuid references profiles (id) on delete set null,
  amount_discounted bigint not null check (amount_discounted >= 0),
  created_at        timestamptz not null default now(),

  -- Un cupón, una vez por pedido.
  unique (coupon_id, order_id)
);

create index coupon_redemptions_user_idx on coupon_redemptions (user_id, coupon_id);
create index coupon_redemptions_coupon_idx on coupon_redemptions (coupon_id);
