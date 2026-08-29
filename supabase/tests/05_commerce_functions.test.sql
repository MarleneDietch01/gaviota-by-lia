-- =============================================================================
-- 05_commerce_functions.test.sql — Inventario, reservas y cupones
-- =============================================================================
-- Estas funciones son el punto donde el sistema maneja dinero e inventario.
-- Se prueban como propietario (así las invoca el servidor con service_role),
-- porque lo que se verifica aquí es la lógica, no la autorización — eso ya lo
-- cubre 04_rls_sensitive.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

\set variant 'b0000001-0000-4000-8000-000000000001'
\set scarce  'b0000005-0000-4000-8000-000000000005'

-- =============================================================================
-- RESERVA DE INVENTARIO
-- =============================================================================
select is(
  (select stock_quantity from product_variants where sku = 'GBL-ACE-115-V'),
  25,
  'Punto de partida: 25 unidades del Aceite Anti-Estrías');

select lives_ok(
  $$ select reserve_inventory('b0000001-0000-4000-8000-000000000001'::uuid, 3, null) $$,
  'Se pueden reservar 3 unidades');

select is(
  (select reserved_quantity from product_variants
    where id = 'b0000001-0000-4000-8000-000000000001'),
  3,
  'reserved_quantity subió a 3');

select is(
  (select stock_quantity from product_variants
    where id = 'b0000001-0000-4000-8000-000000000001'),
  25,
  'stock_quantity NO baja al reservar: la reserva no es una venta');

select is(
  (select count(*)::int from inventory_movements
    where variant_id = 'b0000001-0000-4000-8000-000000000001'
      and movement_type = 'reservation'),
  1,
  'La reserva dejó su asiento en el libro mayor');

-- El Sérum tiene 3 unidades en los seeds.
select throws_ok(
  $$ select reserve_inventory('b0000005-0000-4000-8000-000000000005'::uuid, 4, null) $$,
  'P0001',
  null,
  'No se puede reservar más stock del disponible (INSUFFICIENT_STOCK)');

select lives_ok(
  $$ select reserve_inventory('b0000005-0000-4000-8000-000000000005'::uuid, 3, null) $$,
  'Sí se pueden reservar las 3 últimas unidades');

-- La segunda clienta que intenta la última unidad se queda sin ella.
select throws_ok(
  $$ select reserve_inventory('b0000005-0000-4000-8000-000000000005'::uuid, 1, null) $$,
  'P0001',
  null,
  'Agotado el stock, una reserva más falla limpiamente');

select throws_ok(
  $$ select reserve_inventory('b0000001-0000-4000-8000-000000000001'::uuid, 0, null) $$,
  '22023',
  null,
  'Una cantidad de cero es rechazada');

select throws_ok(
  $$ select reserve_inventory('b0000001-0000-4000-8000-000000000001'::uuid, -5, null) $$,
  '22023',
  null,
  'Una cantidad negativa es rechazada');

-- =============================================================================
-- VENTA Y LIBERACIÓN
-- =============================================================================
insert into orders (id, customer_email, subtotal, grand_total, order_status)
values ('77777777-7777-4777-8777-777777777777', 'venta@test.com', 5000, 5000, 'pending_payment');

insert into order_items (order_id, product_id, variant_id, product_name, quantity,
                         unit_price, line_total)
values ('77777777-7777-4777-8777-777777777777',
        'a0000001-0000-4000-8000-000000000001',
        'b0000001-0000-4000-8000-000000000001',
        'Aceite Anti-Estrías', 2, 5000, 10000);

select lives_ok(
  $$ select commit_inventory_sale('77777777-7777-4777-8777-777777777777'::uuid) $$,
  'Confirmar el pago convierte la reserva en salida definitiva');

select is(
  (select stock_quantity from product_variants
    where id = 'b0000001-0000-4000-8000-000000000001'),
  23,
  'Ahora sí baja el stock real: 25 - 2 = 23');

select is(
  (select count(*)::int from inventory_movements
    where variant_id = 'b0000001-0000-4000-8000-000000000001'
      and movement_type = 'sale'),
  1,
  'La venta dejó su asiento');

select lives_ok(
  $$ select release_reservation('77777777-7777-4777-8777-777777777777'::uuid) $$,
  'Se puede liberar una reserva (pago fallido o expirado)');

-- =============================================================================
-- CUPONES
-- =============================================================================
insert into coupons (code, discount_type, discount_value, minimum_amount, expires_at)
values ('DIEZ', 'percentage', 1000, 3000, now() + interval '30 days');

-- starts_at también en el pasado: la restricción expires_after_start impide
-- expires_at <= starts_at, y starts_at usa default now().
insert into coupons (code, discount_type, discount_value, status, starts_at, expires_at)
values ('CADUCADO', 'fixed', 500, 'active',
        now() - interval '30 days', now() - interval '1 day');

select is(
  calculate_coupon_discount('DIEZ', 10000, null),
  1000::bigint,
  'Un cupón del 10 % sobre 100,00 USD descuenta 10,00 USD');

select is(
  calculate_coupon_discount('diez', 10000, null),
  1000::bigint,
  'El código es insensible a mayúsculas (citext)');

select throws_ok(
  $$ select calculate_coupon_discount('DIEZ', 1000, null) $$,
  'P0001',
  null,
  'Un cupón con compra mínima rechaza un subtotal menor');

select throws_ok(
  $$ select calculate_coupon_discount('CADUCADO', 10000, null) $$,
  'P0001',
  null,
  'Un cupón caducado es rechazado');

select * from finish();
rollback;
