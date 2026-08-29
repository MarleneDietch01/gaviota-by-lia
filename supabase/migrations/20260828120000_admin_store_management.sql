-- Administración completa del catálogo, permisos e inventario.
-- Todos los cambios son aditivos y preservan las filas existentes.

alter table products
  add column if not exists name_en text,
  add column if not exists short_description_en text,
  add column if not exists description_en text,
  add column if not exists size_label_en text,
  add column if not exists usage_instructions_en text,
  add column if not exists precautions_en text;

alter table product_images
  add column if not exists locale text not null default 'all',
  add column if not exists image_role text not null default 'gallery';

alter table product_images
  add constraint product_images_locale_known check (locale in ('all', 'es', 'en')),
  add constraint product_images_role_known check (image_role in ('main', 'hover', 'gallery'));

-- Las principales históricas siguen siendo principales en ambos idiomas.
update product_images set image_role = 'main' where is_primary;

drop index if exists product_images_one_primary;
create unique index product_images_one_role_per_locale
  on product_images (product_id, locale, image_role)
  where image_role in ('main', 'hover');

create index product_images_admin_order_idx
  on product_images (product_id, locale, image_role, sort_order);

-- Un solo asiento de venta por variante y pedido. Esta restricción hace la
-- confirmación idempotente incluso si llegan dos tipos de evento de pago.
create unique index inventory_sale_once_per_order_variant
  on inventory_movements (order_id, variant_id)
  where movement_type = 'sale' and order_id is not null;

create or replace function commit_inventory_sale(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r record;
  v_stock int;
  v_committed int := 0;
begin
  for r in
    select oi.variant_id, oi.product_id, sum(oi.quantity)::int as quantity
      from public.order_items oi
     where oi.order_id = p_order_id and oi.variant_id is not null
     group by oi.variant_id, oi.product_id
  loop
    -- Se bloquea la fila de la variante ANTES de comprobar la idempotencia.
    -- Si dos eventos de pago del mismo pedido llegan a la vez
    -- (checkout.session.completed y payment_intent.succeeded son eventos
    -- distintos, con IDs distintos, y Stripe los entrega por separado), el
    -- segundo espera aquí; al continuar ya ve el asiento de venta del primero
    -- y sale por el `continue`. Con la comprobación fuera del lock, ambos
    -- pasaban el `if exists` y ambos descontaban `stock_quantity` — el
    -- `on conflict do nothing` solo protegía el asiento, no el UPDATE.
    select stock_quantity into v_stock
      from public.product_variants where id = r.variant_id for update;

    if exists (
      select 1 from public.inventory_movements im
       where im.order_id = p_order_id and im.variant_id = r.variant_id
         and im.movement_type = 'sale'
    ) then
      continue;
    end if;

    if v_stock < r.quantity then
      raise exception 'INSUFFICIENT_STOCK_ON_COMMIT: variante %, stock %, requerido %',
        r.variant_id, v_stock, r.quantity using errcode = 'P0001';
    end if;

    update public.product_variants
       set stock_quantity = stock_quantity - r.quantity,
           reserved_quantity = greatest(0, reserved_quantity - r.quantity),
           updated_at = now()
     where id = r.variant_id;

    insert into public.inventory_movements (
      product_id, variant_id, movement_type, quantity,
      previous_quantity, new_quantity, reason, order_id
    ) values (
      r.product_id, r.variant_id, 'sale', -r.quantity,
      v_stock, v_stock - r.quantity,
      'Venta confirmada por webhook de pago', p_order_id
    ) on conflict (order_id, variant_id) where movement_type = 'sale' and order_id is not null
      do nothing;
    v_committed := v_committed + 1;
  end loop;
  return v_committed;
end;
$$;

-- Solo super_admin puede cambiar roles, y nunca puede desaparecer el último.
create or replace function enforce_role_management()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor_role user_role;
  v_super_admins int;
begin
  if new.role is distinct from old.role then
    select role into v_actor_role from public.profiles where id = auth.uid();
    if auth.uid() is not null and v_actor_role is distinct from 'super_admin' then
      raise exception 'FORBIDDEN: solo super_admin puede cambiar roles' using errcode = '42501';
    end if;
    if old.role = 'super_admin' and new.role <> 'super_admin' then
      select count(*) into v_super_admins from public.profiles
       where role = 'super_admin' and status = 'active';
      if v_super_admins <= 1 then
        raise exception 'LAST_SUPER_ADMIN: no se puede retirar el último superadministrador'
          using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_role_management
  before update on profiles
  for each row execute function enforce_role_management();
