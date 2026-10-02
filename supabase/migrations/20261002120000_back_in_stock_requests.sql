-- =============================================================================
-- Avisos de reposición ("Avísame cuando vuelva")
-- =============================================================================
--
-- Una fila por producto y correo. Se crea desde la ficha de un producto
-- agotado y se marca `notified_at` cuando sale el correo de "ya volvió".
--
-- Solo el servidor escribe aquí (cliente admin, igual que `contact_messages`):
-- no hay política de inserción para `anon`/`authenticated`, así que nadie
-- puede volcar ni leer la lista desde el navegador.
--
-- Es un aviso de un solo uso, no una suscripción de marketing: el correo
-- sale una vez y la fila queda cerrada. Una nueva reposición no reenvía a
-- quien ya fue avisado; si vuelve a agotarse, la clienta se apunta otra vez.
-- =============================================================================

create table if not exists back_in_stock_requests (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  email       extensions.citext not null,
  locale      text not null default 'es',
  ip_hash     text,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,

  constraint back_in_stock_locale_known check (locale in ('es', 'en'))
);

-- Una petición ABIERTA por producto y correo. Las ya avisadas no cuentan,
-- para que la misma clienta pueda volver a apuntarse en el siguiente agotado.
create unique index if not exists back_in_stock_open_once_idx
  on back_in_stock_requests (product_id, email)
  where notified_at is null;

create index if not exists back_in_stock_pending_idx
  on back_in_stock_requests (product_id)
  where notified_at is null;

alter table back_in_stock_requests enable row level security;

create policy back_in_stock_admin_all on back_in_stock_requests
  for all to authenticated
  using (is_admin()) with check (is_admin());

grant select, insert, update, delete on back_in_stock_requests to authenticated, service_role;

comment on table back_in_stock_requests is
  'Peticiones de aviso cuando un producto agotado vuelve a tener stock. Un correo, una vez.';
