-- =============================================================================
-- 0014_functions.sql — Funciones de comercio, inventario y autorización
-- =============================================================================
-- Todas son security definer con search_path fijado. Sin fijar search_path, un
-- esquema malicioso anterior en el search_path del invocador podría suplantar
-- a las funciones llamadas dentro de una función security definer.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin() — comprobación de rol para RLS
-- -----------------------------------------------------------------------------
-- Consulta profiles, la única fuente de verdad. Nunca lee el JWT.
-- Exige status = 'active': suspender a un administrador le retira el acceso
-- de inmediato, sin esperar a que caduque su token.
-- -----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role in ('admin', 'super_admin')
       and status = 'active'
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'super_admin'
       and status = 'active'
  );
$$;

-- -----------------------------------------------------------------------------
-- reserve_inventory() — el punto de concurrencia del sistema
-- -----------------------------------------------------------------------------
-- FOR UPDATE bloquea la fila de la variante. Si dos clientas compran a la vez
-- la última unidad, la segunda transacción ESPERA a que la primera termine y
-- entonces encuentra el stock ya comprometido, fallando limpiamente.
--
-- Sin FOR UPDATE ambas leerían "queda 1", ambas reservarían, y el resultado
-- sería inventario negativo o un pedido imposible de servir.
--
-- La reserva y su movimiento de inventario ocurren en la MISMA transacción:
-- no existe un estado intermedio en el que el stock cambie sin dejar asiento.
-- -----------------------------------------------------------------------------
create or replace function reserve_inventory(
  p_variant_id uuid,
  p_quantity   int,
  p_order_id   uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_stock      int;
  v_reserved   int;
  v_available  int;
  v_product_id uuid;
  v_track      boolean;
begin
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: la cantidad debe ser positiva'
      using errcode = '22023';
  end if;

  -- FOR UPDATE: serializa a los compradores concurrentes sobre esta variante.
  select v.stock_quantity, v.reserved_quantity, v.product_id, p.track_inventory
    into v_stock, v_reserved, v_product_id, v_track
    from public.product_variants v
    join public.products p on p.id = v.product_id
   where v.id = p_variant_id
     for update of v;

  if not found then
    raise exception 'VARIANT_NOT_FOUND: %', p_variant_id using errcode = 'P0002';
  end if;

  -- Productos sin control de inventario: no se reserva nada.
  if not v_track then
    return;
  end if;

  v_available := v_stock - v_reserved;

  if v_available < p_quantity then
    raise exception 'INSUFFICIENT_STOCK: disponible %, solicitado %',
      v_available, p_quantity
      using errcode = 'P0001';
  end if;

  update public.product_variants
     set reserved_quantity = reserved_quantity + p_quantity,
         updated_at        = now()
   where id = p_variant_id;

  insert into public.inventory_movements (
    product_id, variant_id, movement_type, quantity,
    previous_quantity, new_quantity, reason, order_id
  ) values (
    v_product_id, p_variant_id, 'reservation', 0 - p_quantity,
    v_available, v_available - p_quantity,
    'Reserva al iniciar el pago', p_order_id
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- release_reservation() — devuelve al stock las reservas de un pedido
-- -----------------------------------------------------------------------------
create or replace function release_reservation(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r           record;
  v_released  int := 0;
  v_available int;
begin
  for r in
    select oi.variant_id, oi.product_id, oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id
       and oi.variant_id is not null
  loop
    select stock_quantity - reserved_quantity into v_available
      from public.product_variants
     where id = r.variant_id
       for update;

    update public.product_variants
       set reserved_quantity = greatest(0, reserved_quantity - r.quantity),
           updated_at        = now()
     where id = r.variant_id;

    insert into public.inventory_movements (
      product_id, variant_id, movement_type, quantity,
      previous_quantity, new_quantity, reason, order_id
    ) values (
      r.product_id, r.variant_id, 'reservation_release', r.quantity,
      v_available, v_available + r.quantity,
      'Liberación de reserva', p_order_id
    );

    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

-- -----------------------------------------------------------------------------
-- commit_inventory_sale() — reserva -> salida definitiva
-- -----------------------------------------------------------------------------
-- Se llama SOLO desde el manejador del webhook, cuando el pago está confirmado.
-- Descuenta del stock real y suelta la reserva a la vez.
-- -----------------------------------------------------------------------------
create or replace function commit_inventory_sale(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r          record;
  v_stock    int;
  v_committed int := 0;
begin
  for r in
    select oi.variant_id, oi.product_id, oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id
       and oi.variant_id is not null
  loop
    select stock_quantity into v_stock
      from public.product_variants
     where id = r.variant_id
       for update;

    if v_stock < r.quantity then
      raise exception 'INSUFFICIENT_STOCK_ON_COMMIT: variante %, stock %, requerido %',
        r.variant_id, v_stock, r.quantity
        using errcode = 'P0001';
    end if;

    update public.product_variants
       set stock_quantity    = stock_quantity - r.quantity,
           reserved_quantity = greatest(0, reserved_quantity - r.quantity),
           updated_at        = now()
     where id = r.variant_id;

    insert into public.inventory_movements (
      product_id, variant_id, movement_type, quantity,
      previous_quantity, new_quantity, reason, order_id
    ) values (
      r.product_id, r.variant_id, 'sale', 0 - r.quantity,
      v_stock, v_stock - r.quantity,
      'Venta confirmada por webhook de pago', p_order_id
    );

    v_committed := v_committed + 1;
  end loop;

  return v_committed;
end;
$$;

-- -----------------------------------------------------------------------------
-- adjust_inventory() — ajuste manual desde el panel
-- -----------------------------------------------------------------------------
-- Única vía para cambiar el stock a mano, y exige motivo. No existe ninguna
-- ruta que haga UPDATE stock_quantity directo.
-- -----------------------------------------------------------------------------
create or replace function adjust_inventory(
  p_variant_id    uuid,
  p_new_quantity  int,
  p_reason        text,
  p_movement_type movement_type default 'adjustment'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_stock      int;
  v_reserved   int;
  v_product_id uuid;
begin
  if not is_admin() then
    raise exception 'FORBIDDEN: solo administradores' using errcode = '42501';
  end if;

  if p_new_quantity < 0 then
    raise exception 'INVALID_QUANTITY: el stock no puede ser negativo'
      using errcode = '22023';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED: todo ajuste exige motivo'
      using errcode = '22023';
  end if;

  select stock_quantity, reserved_quantity, product_id
    into v_stock, v_reserved, v_product_id
    from public.product_variants
   where id = p_variant_id
     for update;

  if not found then
    raise exception 'VARIANT_NOT_FOUND: %', p_variant_id using errcode = 'P0002';
  end if;

  if p_new_quantity < v_reserved then
    raise exception 'BELOW_RESERVED: hay % unidades reservadas', v_reserved
      using errcode = '22023';
  end if;

  if p_new_quantity = v_stock then
    return;   -- sin cambio, sin asiento
  end if;

  update public.product_variants
     set stock_quantity = p_new_quantity,
         updated_at     = now()
   where id = p_variant_id;

  insert into public.inventory_movements (
    product_id, variant_id, movement_type, quantity,
    previous_quantity, new_quantity, reason, created_by
  ) values (
    v_product_id, p_variant_id, p_movement_type, p_new_quantity - v_stock,
    v_stock, p_new_quantity, p_reason, auth.uid()
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- expire_stale_reservations() — la llama el cron
-- -----------------------------------------------------------------------------
create or replace function expire_stale_reservations()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r       record;
  v_count int := 0;
begin
  for r in
    select id from public.orders
     where order_status = 'pending_payment'
       and reservation_expires_at is not null
       and reservation_expires_at < now()
  loop
    perform release_reservation(r.id);

    update public.orders
       set order_status   = 'cancelled',
           payment_status = 'cancelled',
           updated_at     = now()
     where id = r.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- calculate_coupon_discount() — validación y cálculo en servidor
-- -----------------------------------------------------------------------------
-- Devuelve el descuento EN CENTAVOS. Nunca se acepta un descuento del cliente.
-- -----------------------------------------------------------------------------
create or replace function calculate_coupon_discount(
  p_code     text,
  p_subtotal bigint,
  p_user_id  uuid default null
)
returns bigint
language plpgsql
security definer
stable
set search_path = public, extensions
as $$
declare
  c          record;
  v_discount bigint;
  v_user_uses int;
begin
  select * into c
    from public.coupons
   where code = p_code::extensions.citext
     and status = 'active';

  if not found then
    raise exception 'COUPON_NOT_FOUND' using errcode = 'P0002';
  end if;

  if now() < c.starts_at then
    raise exception 'COUPON_NOT_STARTED' using errcode = 'P0001';
  end if;

  if c.expires_at is not null and now() > c.expires_at then
    raise exception 'COUPON_EXPIRED' using errcode = 'P0001';
  end if;

  if c.usage_limit is not null and c.usage_count >= c.usage_limit then
    raise exception 'COUPON_USAGE_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  if c.minimum_amount is not null and p_subtotal < c.minimum_amount then
    raise exception 'COUPON_MINIMUM_NOT_MET: mínimo %', c.minimum_amount
      using errcode = 'P0001';
  end if;

  if c.per_user_limit is not null and p_user_id is not null then
    select count(*) into v_user_uses
      from public.coupon_redemptions
     where coupon_id = c.id and user_id = p_user_id;

    if v_user_uses >= c.per_user_limit then
      raise exception 'COUPON_USER_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  if c.discount_type = 'percentage' then
    -- discount_value en centésimas de punto: 1000 = 10,00 %
    v_discount := (p_subtotal * c.discount_value) / 10000;
  else
    v_discount := c.discount_value;
  end if;

  if c.maximum_discount is not null then
    v_discount := least(v_discount, c.maximum_discount);
  end if;

  -- El descuento nunca supera al subtotal: sin totales negativos.
  return least(v_discount, p_subtotal);
end;
$$;

-- -----------------------------------------------------------------------------
-- has_verified_purchase() — respalda verified_purchase en las reseñas
-- -----------------------------------------------------------------------------
create or replace function has_verified_purchase(p_user_id uuid, p_product_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
     where o.user_id = p_user_id
       and oi.product_id = p_product_id
       and o.order_status = 'delivered'
  );
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución
-- -----------------------------------------------------------------------------
-- Las funciones que mutan inventario NO son invocables por clientes: solo desde
-- el servidor con la service_role. Un cliente que pudiera llamar a
-- reserve_inventory() podría agotar el stock del catálogo entero.
revoke execute on function reserve_inventory(uuid, int, uuid)   from anon, authenticated;
revoke execute on function release_reservation(uuid)            from anon, authenticated;
revoke execute on function commit_inventory_sale(uuid)          from anon, authenticated;
revoke execute on function expire_stale_reservations()          from anon, authenticated;
revoke execute on function calculate_coupon_discount(text, bigint, uuid)
                                                                from anon, authenticated;
revoke execute on function generate_order_number()              from anon, authenticated;

-- adjust_inventory comprueba is_admin() por dentro, así que puede exponerse.
grant execute on function adjust_inventory(uuid, int, text, movement_type)
  to authenticated;

grant execute on function is_admin()       to anon, authenticated;
grant execute on function is_super_admin() to anon, authenticated;
grant execute on function has_verified_purchase(uuid, uuid) to authenticated;
