-- =============================================================================
-- 04_rls_sensitive.test.sql — Pagos, inventario, ajustes, auditoría, contenido
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into orders (id, user_id, customer_email, subtotal, grand_total)
values ('88888888-8888-4888-8888-888888888888',
        '11111111-1111-1111-1111-111111111111',
        'cliente.a@ejemplo.test', 5000, 5000);

insert into payments (order_id, provider, idempotency_key, amount, currency, status)
values ('88888888-8888-4888-8888-888888888888', 'mock', 'idem-test-1', 5000, 'USD', 'pending');

insert into coupons (code, discount_type, discount_value, minimum_amount)
values ('PRUEBA10', 'percentage', 1000, 3000);

-- =============================================================================
-- CLIENTA — tablas sensibles
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true);
set local role authenticated;

select is_empty(
  $$ select id from payments $$,
  'Una clienta NO ve la tabla de pagos, ni siquiera los suyos');

select is_empty(
  $$ select id from payment_events $$,
  'Una clienta NO ve los eventos de webhook');

select is_empty(
  $$ select id from inventory_movements $$,
  'Una clienta NO ve el libro mayor de inventario');

select is_empty(
  $$ select setting_key from site_settings $$,
  'Una clienta NO ve los ajustes del sitio');

select is_empty(
  $$ select id from audit_logs $$,
  'Una clienta NO ve la auditoría');

select is_empty(
  $$ select code from coupons $$,
  'Una clienta NO puede listar cupones y usar códigos que no le dieron');

select is_empty(
  $$ select id from contact_messages $$,
  'Una clienta NO ve los mensajes de contacto');

select is_empty(
  $$ select email from newsletter_subscribers $$,
  'Una clienta NO ve la lista de la newsletter');

-- Stock: el UPDATE se filtra por RLS
select lives_ok(
  $$ update product_variants set stock_quantity = 9999
      where sku = 'GBL-ACE-115-V' $$,
  'El intento de una clienta de alterar el stock no lanza error...');

reset role;

select is(
  (select stock_quantity from product_variants where sku = 'GBL-ACE-115-V'),
  25,
  '...pero el stock NO cambió');

-- Funciones de inventario: no invocables por clientes
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true);
set local role authenticated;

select throws_ok(
  $$ select reserve_inventory('b0000001-0000-4000-8000-000000000001'::uuid, 1, null) $$,
  '42501',
  null,
  'Una clienta NO puede llamar a reserve_inventory y agotar el catálogo');

select throws_ok(
  $$ select calculate_coupon_discount('PRUEBA10', 10000, null) $$,
  '42501',
  null,
  'Una clienta NO puede invocar el cálculo de descuentos');

select throws_ok(
  $$ select adjust_inventory('b0000001-0000-4000-8000-000000000001'::uuid, 9999, 'intento') $$,
  '42501',
  null,
  'adjust_inventory rechaza a quien no es administrador');

-- Contenido
select is_empty(
  $$ select section_key from content_sections
      where section_key in ('home.testimonials', 'home.ugc') $$,
  'Las secciones en draft (testimonios, UGC) son invisibles en producción');

reset role;

-- =============================================================================
-- ADMINISTRADOR — la auditoría es de super_admin
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true);
set local role authenticated;

select is_empty(
  $$ select id from audit_logs $$,
  'Un admin normal TAMPOCO ve la auditoría: es exclusiva de super_admin');

reset role;

-- =============================================================================
-- SUPER ADMINISTRADOR
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}',
  true);
set local role authenticated;

select is(
  (select is_super_admin()),
  true,
  'is_super_admin() reconoce al super administrador');

reset role;

select * from finish();
rollback;
