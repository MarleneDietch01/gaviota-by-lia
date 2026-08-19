-- =============================================================================
-- 20260819180000_rate_limits.sql — Límite de intentos en endpoints públicos
-- =============================================================================
-- Respaldado en Postgres y no en memoria del proceso: en un despliegue
-- serverless (Vercel) cada invocación puede caer en una instancia distinta sin
-- memoria compartida, así que un contador en memoria no limitaría nada de
-- verdad. La base de datos es el único estado que todas las invocaciones ven
-- por igual.
--
-- Mismo patrón que el resto del esquema: tabla con RLS sin políticas (acceso
-- cero directo, ni para `anon` ni para `authenticated`) + función
-- `security definer` que es la única vía de entrada, con `search_path` fijado.
-- =============================================================================

create table rate_limit_attempts (
  id         bigint generated always as identity primary key,
  bucket_key text        not null,
  created_at timestamptz not null default now()
);

create index rate_limit_attempts_bucket_idx on rate_limit_attempts (bucket_key, created_at desc);

alter table rate_limit_attempts enable row level security;
-- Sin políticas: ni anon ni authenticated pueden leer ni escribir esta tabla
-- directamente. Toda interacción pasa por check_rate_limit().
revoke all on rate_limit_attempts from anon, authenticated;

comment on table rate_limit_attempts is
  'Registro de intentos para limitar fuerza bruta. Se purga con prune_rate_limit_attempts().';

-- -----------------------------------------------------------------------------
-- check_rate_limit() — registra un intento y dice si está dentro del límite
-- -----------------------------------------------------------------------------
-- Registra PRIMERO y cuenta después, igual que la idempotencia de webhooks en
-- 0008: así una petición concurrente no se cuela en la ventana entre "contar"
-- y "registrar". Devuelve `false` cuando el intento actual ya excede el
-- máximo — el llamador decide qué hacer (rechazar la petición).
-- -----------------------------------------------------------------------------
create or replace function check_rate_limit(
  p_bucket_key text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count int;
begin
  insert into rate_limit_attempts (bucket_key) values (p_bucket_key);

  select count(*) into v_count
    from rate_limit_attempts
   where bucket_key = p_bucket_key
     and created_at > now() - make_interval(secs => p_window_seconds);

  return v_count <= p_max_attempts;
end;
$$;

comment on function check_rate_limit is
  'Registra un intento bajo p_bucket_key y devuelve si sigue dentro del límite '
  '(p_max_attempts intentos por cada p_window_seconds segundos).';

-- `anon` necesita poder llamarla desde login/registro sin sesión. Al ser
-- security definer, la función corre con más privilegio que quien la invoca,
-- pero SOLO hace lo que su cuerpo permite (insertar y contar) — no abre la
-- tabla entera.
grant execute on function check_rate_limit(text, int, int) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- prune_rate_limit_attempts() — limpieza periódica
-- -----------------------------------------------------------------------------
-- Sin esto la tabla crece sin límite. Se llama desde un cron (igual que
-- expire_stale_reservations en 0014) — no está programado automáticamente
-- todavía, solo la función queda lista.
-- -----------------------------------------------------------------------------
create or replace function prune_rate_limit_attempts()
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from rate_limit_attempts where created_at < now() - interval '1 day';
$$;
