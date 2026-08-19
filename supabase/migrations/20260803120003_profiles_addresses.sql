-- =============================================================================
-- 0003_profiles_addresses.sql — Perfiles y direcciones
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- profiles.role es LA ÚNICA FUENTE DE VERDAD del rol.
-- No se copia al JWT ni a ninguna cookie: se consulta contra esta tabla en cada
-- petición que lo requiera. Un rol dentro del token es un rol que el cliente
-- puede intentar manipular, y que además queda obsoleto al degradar a alguien.
-- -----------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name  text,
  email      extensions.citext not null,
  phone      text,
  role       user_role   not null default 'customer',
  status     user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key on profiles (email);
create index profiles_role_idx on profiles (role) where role <> 'customer';

comment on table  profiles is 'Perfil de usuario. Extiende auth.users.';
comment on column profiles.role is
  'Única fuente de verdad del rol. Nunca se lee del JWT ni del cliente.';

-- -----------------------------------------------------------------------------
-- Alta automática del perfil al registrarse
-- -----------------------------------------------------------------------------
-- security definer porque auth.users pertenece a supabase_auth_admin.
-- search_path fijado: sin esto, un esquema malicioso en el search_path del
-- invocador podría suplantar a las funciones que se llamen dentro.
--
-- El rol se fuerza a 'customer'. Los metadatos del registro los controla el
-- cliente, así que NUNCA se leen para determinar el rol: si alguien enviara
-- {"role":"admin"} en el signup, aquí se ignora por completo.
-- -----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    'customer'                       -- SIEMPRE. Nunca desde los metadatos.
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- Bloqueo de escalada de privilegios
-- -----------------------------------------------------------------------------
-- RLS con WITH CHECK no puede comparar el valor nuevo con el anterior, así que
-- la prohibición de auto-ascenderse se implementa con un trigger.
--
-- Efecto: aunque una política RLS permitiera a un cliente actualizar su perfil
-- (y se lo permite, para que edite su nombre), no puede cambiar su propio rol
-- ni su estado. Solo un administrador puede.
-- -----------------------------------------------------------------------------
create or replace function prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor_role user_role;
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
  then
    select role into v_actor_role
      from public.profiles
     where id = auth.uid();

    -- auth.uid() es null cuando escribe la service_role (webhooks, seeds,
    -- tareas administrativas del servidor): ahí sí se permite.
    if auth.uid() is not null
       and (v_actor_role is null or v_actor_role not in ('admin', 'super_admin'))
    then
      raise exception 'FORBIDDEN: no se puede modificar role ni status'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on profiles
  for each row
  execute function prevent_role_escalation();

-- -----------------------------------------------------------------------------
-- addresses
-- -----------------------------------------------------------------------------
create table addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles (id) on delete cascade,
  label          text,
  recipient_name text not null,
  phone          text,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text,
  postal_code    text,
  country        char(2) not null,          -- ISO 3166-1 alpha-2
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint country_is_uppercase check (country = upper(country))
);

create index addresses_user_id_idx on addresses (user_id);

-- Índice único parcial: una sola dirección predeterminada por usuario,
-- garantizado por el motor y no por lógica de aplicación que pueda fallar.
create unique index addresses_one_default_per_user
  on addresses (user_id)
  where is_default;
