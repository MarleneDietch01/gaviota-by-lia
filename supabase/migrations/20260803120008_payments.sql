-- =============================================================================
-- 0008_payments.sql — Pagos y eventos de webhook
-- =============================================================================
-- NUNCA se almacena: número completo de tarjeta, CVV/CVC, fecha de caducidad,
-- banda magnética ni PIN.
--
-- Los datos de tarjeta no tocan este servidor: se introducen en el formulario
-- alojado o en el componente embebido del proveedor. Esto mantiene el alcance
-- PCI en el nivel mínimo (SAQ A).
-- =============================================================================

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders (id) on delete cascade,
  provider            text not null,               -- 'mock', 'stripe', ...
  provider_payment_id text,
  idempotency_key     text not null unique,
  amount              bigint not null check (amount > 0),   -- centavos
  currency            char(3) not null,
  status              payment_status not null default 'pending',
  payment_method      text,          -- 'visa ****4242' — jamás el número entero
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Un pago en estado 'paid' tiene que tener fecha de cobro.
  constraint paid_needs_timestamp
    check (status <> 'paid' or paid_at is not null),

  -- Guarda como mucho marca y últimos 4 dígitos. Si alguien intentara escribir
  -- un PAN completo (13-19 dígitos seguidos), la base de datos lo rechaza.
  constraint payment_method_not_a_pan
    check (payment_method is null or payment_method !~ '[0-9]{13,19}')
);

create index payments_order_idx    on payments (order_id);
create index payments_provider_idx on payments (provider, provider_payment_id);

comment on constraint payment_method_not_a_pan on payments is
  'Impide almacenar un número de tarjeta completo por accidente.';

-- -----------------------------------------------------------------------------
-- payment_events — idempotencia del webhook
-- -----------------------------------------------------------------------------
-- unique (provider, provider_event_id) ES lo que hace idempotente el webhook.
--
-- Los proveedores reintentan ante cualquier duda: un timeout, un 500, una
-- respuesta lenta. Sin esta restricción, un reintento descontaría inventario
-- dos veces y enviaría dos correos de confirmación.
--
-- El manejador INSERTA PRIMERO y procesa después. Si el insert choca con la
-- clave única, el evento ya se procesó: responde 200 y no hace nada más.
-- Hacerlo al revés (procesar y luego registrar) deja una ventana en la que un
-- reintento simultáneo duplica el efecto.
-- -----------------------------------------------------------------------------
create table payment_events (
  id                uuid primary key default gen_random_uuid(),
  payment_id        uuid references payments (id) on delete cascade,
  provider          text not null,
  provider_event_id text not null,
  event_type        text not null,
  payload_hash      text not null,
  processing_status text not null default 'pending',
  error             text,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),

  unique (provider, provider_event_id),

  constraint processing_status_known
    check (processing_status in ('pending', 'processed', 'failed', 'ignored'))
);

create index payment_events_payment_idx on payment_events (payment_id);
create index payment_events_status_idx
  on payment_events (processing_status, created_at desc);

comment on constraint payment_events_provider_provider_event_id_key on payment_events is
  'Idempotencia del webhook. Un evento repetido no se reprocesa.';
comment on column payment_events.payload_hash is
  'Hash del payload, no el payload completo: permite detectar manipulación sin '
  'almacenar datos de pago innecesarios.';
