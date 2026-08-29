-- =============================================================================
-- 06_admin_store_management.test.sql — Migración 20260828120000
-- =============================================================================
-- Cubre lo que introduce la administración de tienda: imágenes por idioma y
-- rol, idempotencia de la venta de inventario y gestión de roles.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

\set product 'a0000001-0000-4000-8000-000000000001'
\set variant 'b0000001-0000-4000-8000-000000000001'

-- -----------------------------------------------------------------------------
-- IMÁGENES: idioma y rol
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, locale)
     values ('a0000001-0000-4000-8000-000000000001', 'x/a.jpg', 'a', 10, 10, 'fr') $$,
  '23514', null,
  'locale solo admite all/es/en (product_images_locale_known)');

select throws_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, image_role)
     values ('a0000001-0000-4000-8000-000000000001', 'x/b.jpg', 'b', 10, 10, 'banner') $$,
  '23514', null,
  'image_role solo admite main/hover/gallery (product_images_role_known)');

select lives_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, image_role, locale)
     values ('a0000001-0000-4000-8000-000000000001', 'x/main-all.jpg', 'principal', 10, 10, 'main', 'all') $$,
  'Se puede registrar la imagen principal de "ambos idiomas"');

select throws_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, image_role, locale)
     values ('a0000001-0000-4000-8000-000000000001', 'x/main-all-2.jpg', 'otra', 10, 10, 'main', 'all') $$,
  '23505', null,
  'Una SEGUNDA principal para el mismo idioma choca (product_images_one_role_per_locale)');

select lives_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, image_role, locale)
     values ('a0000001-0000-4000-8000-000000000001', 'x/main-en.jpg', 'main en', 10, 10, 'main', 'en') $$,
  'Pero SÍ se puede tener una principal distinta para el inglés');

select lives_ok(
  $$ insert into product_images (product_id, storage_path, alt_text, width, height, image_role, locale)
     values
       ('a0000001-0000-4000-8000-000000000001', 'x/g1.jpg', 'galeria 1', 10, 10, 'gallery', 'all'),
       ('a0000001-0000-4000-8000-000000000001', 'x/g2.jpg', 'galeria 2', 10, 10, 'gallery', 'all') $$,
  'La galería no está limitada a una por idioma');

select is(
  (select count(*)::int from product_images
    where product_id = :'product' and image_role = 'main'),
  2,
  'El producto acaba con dos principales: una "all" y una "en"');

-- -----------------------------------------------------------------------------
-- VENTA DE INVENTARIO: idempotente
-- -----------------------------------------------------------------------------
insert into orders (id, customer_email, subtotal, grand_total, order_status)
values ('66666666-6666-4666-8666-666666666666', 'idem@test.com', 5000, 5000, 'pending_payment');
insert into order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, line_total)
values ('66666666-6666-4666-8666-666666666666', :'product', :'variant', 'Aceite', 2, 5000, 10000);

select is(
  (select commit_inventory_sale('66666666-6666-4666-8666-666666666666')),
  1,
  'La primera confirmación descuenta una variante');

select is(
  (select commit_inventory_sale('66666666-6666-4666-8666-666666666666')),
  0,
  'La segunda confirmación del MISMO pedido no descuenta nada');

select is(
  (select stock_quantity from product_variants where id = :'variant'),
  23,
  'El stock bajó exactamente una vez: 25 - 2 = 23');

select is(
  (select count(*)::int from inventory_movements
    where order_id = '66666666-6666-4666-8666-666666666666' and movement_type = 'sale'),
  1,
  'Y hay un solo asiento de venta');

select throws_ok(
  $$ insert into inventory_movements (product_id, variant_id, movement_type, quantity,
       previous_quantity, new_quantity, reason, order_id)
     values ('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
             'sale', -1, 23, 22, 'a mano', '66666666-6666-4666-8666-666666666666') $$,
  '23505', null,
  'Un segundo asiento de venta para (pedido, variante) choca con el índice único');

-- -----------------------------------------------------------------------------
-- GESTIÓN DE ROLES: enforce_role_management
-- -----------------------------------------------------------------------------
-- Un admin normal (no super) no puede cambiar roles.
select set_config('request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ update profiles set role = 'admin'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'Un admin normal NO puede promover a otra persona');

reset role;

-- El super admin sí, pero no puede retirarse siendo el último.
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ update profiles set role = 'admin'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'El super admin SÍ puede promover a otra persona');

select throws_ok(
  $$ update profiles set role = 'admin'
      where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null,
  'Ni el super admin puede retirarse si es el último (LAST_SUPER_ADMIN)');

reset role;

select * from finish();
rollback;
