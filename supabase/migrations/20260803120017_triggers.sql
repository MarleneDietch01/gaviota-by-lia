-- =============================================================================
-- 0017_triggers.sql — Triggers de mantenimiento, historial y auditoría
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'addresses', 'categories', 'products', 'product_variants',
    'carts', 'cart_items', 'orders', 'payments', 'shipments',
    'shipping_rates', 'coupons', 'reviews', 'faqs'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at
         before update on %I
         for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Historial de estados de pedido
-- -----------------------------------------------------------------------------
-- Se registra con trigger, no con lógica de aplicación: así ningún camino de
-- código puede cambiar un estado sin dejar rastro, ni por olvido ni por una
-- ruta nueva que no conozca la convención.
-- -----------------------------------------------------------------------------
create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.order_status is distinct from old.order_status then
    insert into public.order_status_history (
      order_id, previous_status, new_status, changed_by
    ) values (
      new.id, old.order_status, new.order_status, auth.uid()
    );
  end if;

  return new;
end;
$$;

create trigger orders_log_status_change
  after update on orders
  for each row
  execute function log_order_status_change();

-- Asiento inicial del historial al crear el pedido.
create or replace function log_order_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.order_status_history (order_id, previous_status, new_status, note)
  values (new.id, null, new.order_status, 'Pedido creado');
  return new;
end;
$$;

create trigger orders_log_created
  after insert on orders
  for each row
  execute function log_order_created();

-- -----------------------------------------------------------------------------
-- Contador de uso de cupón
-- -----------------------------------------------------------------------------
-- Se incrementa en la base de datos al canjear, no en la aplicación: dos canjes
-- simultáneos del último uso disponible no pueden ambos leer "quedan 1".
-- -----------------------------------------------------------------------------
create or replace function increment_coupon_usage()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.coupons
     set usage_count = usage_count + 1,
         updated_at  = now()
   where id = new.coupon_id;

  return new;
end;
$$;

create trigger coupon_redemptions_increment
  after insert on coupon_redemptions
  for each row
  execute function increment_coupon_usage();

-- -----------------------------------------------------------------------------
-- Auditoría automática
-- -----------------------------------------------------------------------------
-- Guarda el registro anterior COMPLETO en previous_data: cualquier cambio
-- administrativo es reversible. Es la red de seguridad para una propietaria no
-- técnica que está aprendiendo el panel.
-- -----------------------------------------------------------------------------
create or replace function log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_entity_id uuid;
begin
  v_entity_id := case tg_op
                   when 'DELETE' then (to_jsonb(old) ->> 'id')::uuid
                   else               (to_jsonb(new) ->> 'id')::uuid
                 end;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, previous_data, new_data
  ) values (
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case tg_op when 'DELETE' then old else new end;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'product_variants', 'categories',
    'coupons', 'content_sections', 'faqs', 'site_settings', 'shipping_rates'
  ]
  loop
    execute format(
      'create trigger %I_audit
         after insert or update or delete on %I
         for each row execute function log_audit_event()',
      t, t
    );
  end loop;
end $$;

-- orders se audita solo en UPDATE: el INSERT ya queda en order_status_history,
-- y auditar cada creación duplicaría el volumen sin aportar nada.
create trigger orders_audit
  after update on orders
  for each row
  execute function log_audit_event();

-- profiles se audita solo en UPDATE, para dejar rastro de los cambios de rol.
create trigger profiles_audit
  after update on profiles
  for each row
  execute function log_audit_event();

-- -----------------------------------------------------------------------------
-- Blindaje de las tablas inmutables
-- -----------------------------------------------------------------------------
-- Las políticas RLS ya niegan UPDATE y DELETE, pero la service_role las salta.
-- Este trigger cierra también esa puerta: ni el servidor puede reescribir el
-- libro mayor de inventario ni el registro de auditoría.
-- -----------------------------------------------------------------------------
create or replace function forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'IMMUTABLE_TABLE: % no admite % ', tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

create trigger inventory_movements_immutable
  before update or delete on inventory_movements
  for each row execute function forbid_mutation();

create trigger audit_logs_immutable
  before update or delete on audit_logs
  for each row execute function forbid_mutation();

create trigger order_status_history_immutable
  before update or delete on order_status_history
  for each row execute function forbid_mutation();
