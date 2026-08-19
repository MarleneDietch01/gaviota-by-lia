-- =============================================================================
-- 01_schema.test.sql — Garantías estructurales
-- =============================================================================
-- Comprueba que las reglas de negocio críticas están codificadas como
-- restricciones del motor, no como convenciones que alguien pueda saltarse.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

-- -----------------------------------------------------------------------------
-- Dinero en enteros, nunca en coma flotante
-- -----------------------------------------------------------------------------
select col_type_is('public', 'products', 'base_price', 'bigint',
  'products.base_price es bigint (centavos), no float');

select col_type_is('public', 'orders', 'grand_total', 'bigint',
  'orders.grand_total es bigint (centavos), no float');

select is_empty(
  $$ select c.table_name || '.' || c.column_name
       from information_schema.columns c
      where c.table_schema = 'public'
        and c.data_type in ('real', 'double precision')
        and (c.column_name like '%price%' or c.column_name like '%total%'
             or c.column_name like '%amount%' or c.column_name like '%rate%') $$,
  'Ningún importe usa coma flotante en todo el esquema');

-- -----------------------------------------------------------------------------
-- Los totales de un pedido tienen que cuadrar
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ insert into orders (customer_email, subtotal, discount_total, tax_total,
                         shipping_total, grand_total)
     values ('descuadre@test.com', 5000, 0, 0, 800, 9999) $$,
  '23514',
  null,
  'Un pedido con totales que no cuadran es rechazado (totals_add_up)');

select lives_ok(
  $$ insert into orders (customer_email, subtotal, discount_total, tax_total,
                         shipping_total, grand_total)
     values ('correcto@test.com', 5000, 0, 0, 800, 5800) $$,
  'Un pedido con totales correctos sí se acepta');

select throws_ok(
  $$ insert into orders (customer_email, subtotal, discount_total, grand_total)
     values ('descuento@test.com', 1000, 5000, -4000) $$,
  null,
  null,
  'Un descuento mayor que el subtotal es rechazado');

-- -----------------------------------------------------------------------------
-- Inventario nunca negativo
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ update product_variants set stock_quantity = -1
      where sku = 'GBL-ACE-115-V' $$,
  '23514',
  null,
  'El stock negativo es rechazado por el motor');

select throws_ok(
  $$ update product_variants set reserved_quantity = stock_quantity + 1
      where sku = 'GBL-ACE-115-V' $$,
  '23514',
  null,
  'No se puede reservar más stock del que existe');

-- -----------------------------------------------------------------------------
-- El descuento permanente del sitio actual es imposible de reproducir
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ update products set compare_at_price = 6000
      where slug = 'aceite-anti-estrias' $$,
  '23514',
  null,
  'Un precio anterior SIN vigencia es rechazado (compare_at_needs_dates)');

select throws_ok(
  $$ update products
        set compare_at_price = 4000,
            compare_at_starts_at = now(),
            compare_at_ends_at = now() + interval '7 days'
      where slug = 'aceite-anti-estrias' $$,
  '23514',
  null,
  'Un precio anterior MENOR que el actual es rechazado');

select lives_ok(
  $$ update products
        set compare_at_price = 6000,
            compare_at_starts_at = now(),
            compare_at_ends_at = now() + interval '7 days'
      where slug = 'aceite-anti-estrias' $$,
  'Un precio anterior CON vigencia y mayor sí se acepta');

-- -----------------------------------------------------------------------------
-- Accesibilidad e integridad del catálogo
-- -----------------------------------------------------------------------------
select col_not_null('public', 'product_images', 'alt_text',
  'No se puede guardar una imagen sin texto alternativo');

select throws_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height)
     values ('a0000001-0000-4000-8000-000000000001', 'x.jpg', '   ', 100, 100) $$,
  '23514',
  null,
  'Un alt_text en blanco es rechazado');

-- -----------------------------------------------------------------------------
-- Datos de tarjeta
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ insert into payments (order_id, provider, idempotency_key, amount, currency,
                           payment_method)
     select id, 'mock', 'k-pan-test', 100, 'USD', '4242424242424242'
       from orders limit 1 $$,
  '23514',
  null,
  'Un número de tarjeta completo en payment_method es rechazado');

-- -----------------------------------------------------------------------------
-- Cupones
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ insert into coupons (code, discount_type, discount_value)
     values ('IMPOSIBLE', 'percentage', 15000) $$,
  '23514',
  null,
  'Un descuento del 150 % es rechazado (percentage_max_100)');

-- -----------------------------------------------------------------------------
-- Tablas inmutables
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ update inventory_movements set reason = 'manipulado'
      where id = (select id from inventory_movements limit 1) $$,
  '42501',
  null,
  'El libro mayor de inventario no admite UPDATE ni para el propietario');

select throws_ok(
  $$ delete from inventory_movements
      where id = (select id from inventory_movements limit 1) $$,
  '42501',
  null,
  'El libro mayor de inventario no admite DELETE');

-- -----------------------------------------------------------------------------
-- RLS activado en todas las tablas
-- -----------------------------------------------------------------------------
select is_empty(
  $$ select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and not c.relrowsecurity $$,
  'Todas las tablas de public tienen RLS activado');

select * from finish();
rollback;
