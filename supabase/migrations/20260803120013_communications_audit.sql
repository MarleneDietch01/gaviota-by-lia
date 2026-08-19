-- =============================================================================
-- 0013_communications_audit.sql — Comunicaciones y auditoría
-- =============================================================================
-- Se almacena ip_hash, nunca la IP: suficiente para limitar abuso, sin guardar
-- un dato personal innecesario.
-- =============================================================================

create table newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             extensions.citext not null unique,
  status            text not null default 'subscribed',
  source            text,
  unsubscribe_token text not null
                      default encode(extensions.gen_random_bytes(24), 'hex'),
  ip_hash           text,
  subscribed_at     timestamptz not null default now(),
  unsubscribed_at   timestamptz,

  constraint newsletter_status_known
    check (status in ('subscribed', 'unsubscribed', 'bounced')),

  constraint unsubscribed_needs_timestamp
    check (status <> 'unsubscribed' or unsubscribed_at is not null)
);

create unique index newsletter_unsubscribe_token_idx
  on newsletter_subscribers (unsubscribe_token);

-- -----------------------------------------------------------------------------
-- contact_messages
-- -----------------------------------------------------------------------------
create table contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        extensions.citext not null,
  phone        text,
  subject      text,
  order_number text,
  message      text not null,
  status       text not null default 'new',
  ip_hash      text,
  created_at   timestamptz not null default now(),

  constraint contact_status_known
    check (status in ('new', 'read', 'replied', 'archived', 'spam'))
);

create index contact_messages_status_idx on contact_messages (status, created_at desc);

-- -----------------------------------------------------------------------------
-- email_log
-- -----------------------------------------------------------------------------
-- Permite reenviar manualmente una confirmación desde el panel. Importa
-- especialmente durante la migración del correo transaccional a dominio propio:
-- si un correo no llega, hay constancia y se puede reintentar.
-- -----------------------------------------------------------------------------
create table email_log (
  id          uuid primary key default gen_random_uuid(),
  to_email    extensions.citext not null,
  template    text not null,
  order_id    uuid references orders (id) on delete set null,
  provider_id text,
  status      text not null default 'sent',
  error       text,
  created_at  timestamptz not null default now(),

  constraint email_status_known
    check (status in ('sent', 'failed', 'bounced', 'delivered'))
);

create index email_log_order_idx on email_log (order_id);
create index email_log_created_idx on email_log (created_at desc);

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
-- Guarda el estado anterior completo en previous_data: cualquier cambio
-- administrativo es reversible. Es la red de seguridad para una propietaria no
-- técnica que está aprendiendo a usar el panel.
-- -----------------------------------------------------------------------------
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references profiles (id) on delete set null,
  action        text not null,          -- 'product.update', 'order.status_change'
  entity_type   text not null,
  entity_id     uuid,
  previous_data jsonb,
  new_data      jsonb,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index audit_logs_entity_idx
  on audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx  on audit_logs (actor_id, created_at desc);
create index audit_logs_action_idx on audit_logs (action, created_at desc);

comment on table audit_logs is
  'Registro inmutable de acciones administrativas. Sin UPDATE ni DELETE para nadie.';
