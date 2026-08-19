-- =============================================================================
-- 0009_shipping.sql — Envíos y tarifas
-- =============================================================================
-- Las tarifas son datos, no código: editables desde /admin/settings.
--
-- No se inventa ninguna tarifa. Los únicos datos reales de la auditoría son los
-- plazos, que sí constan en la política actual: 2 días hábiles de proceso +
-- 3-4 de entrega con USPS Priority Mail. Los importes los aporta la propietaria
-- (ver SHIPPING_TODO.md).
-- =============================================================================

create table shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders (id) on delete cascade,
  carrier         text,
  tracking_number text,
  tracking_url    text,
  status          text not null default 'pending',
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint shipment_status_known
    check (status in ('pending', 'in_transit', 'delivered', 'returned', 'lost')),

  constraint delivered_after_shipped
    check (delivered_at is null or shipped_at is null or delivered_at >= shipped_at)
);

create index shipments_order_idx    on shipments (order_id);
create index shipments_tracking_idx on shipments (tracking_number)
  where tracking_number is not null;

-- -----------------------------------------------------------------------------
-- shipping_rates
-- -----------------------------------------------------------------------------
-- MVP: tarifa plana configurable + umbral de envío gratis + recogida local.
-- No requiere los pesos de producto, así que el lanzamiento no queda bloqueado
-- por el hecho de que los 8 productos actuales tengan grams = 0.
--
-- Los países sin tarifa activa se bloquean en el checkout: es imposible que
-- entre un pedido a un destino al que no se envía.
-- -----------------------------------------------------------------------------
create table shipping_rates (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,               -- 'USPS Priority Mail'
  country            char(2) not null,
  state              text,                        -- null = todo el país
  rate               bigint not null check (rate >= 0),        -- centavos
  free_above         bigint check (free_above > 0),            -- centavos
  estimated_days_min int check (estimated_days_min >= 0),
  estimated_days_max int check (estimated_days_max >= 0),
  is_local_pickup    boolean not null default false,
  status             entity_status not null default 'active',
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint country_is_uppercase check (country = upper(country)),
  constraint estimated_days_ordered
    check (
      estimated_days_max is null
      or estimated_days_min is null
      or estimated_days_max >= estimated_days_min
    ),
  -- La recogida local no puede costar dinero de envío.
  constraint local_pickup_is_free
    check (not is_local_pickup or rate = 0)
);

create index shipping_rates_lookup_idx
  on shipping_rates (country, state, sort_order)
  where status = 'active';

comment on column shipping_rates.free_above is
  'Umbral de envío gratis en centavos. Si es null, no hay envío gratis y la '
  'barra de progreso del carrito no se muestra: no se inventa un umbral.';
