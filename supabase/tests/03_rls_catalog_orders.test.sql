-- =============================================================================
-- 03_rls_catalog_orders.test.sql — Catálogo y pedidos
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- Pedido de la clienta B, creado como propietario (así lo hace el servidor).
insert into orders (id, user_id, customer_email, subtotal, shipping_total, grand_total)
values ('99999999-9999-4999-8999-999999999999',
        '22222222-2222-2222-2222-222222222222',
        'cliente.b@ejemplo.test', 5000, 800, 5800);

insert into order_items (order_id, product_id, variant_id, product_name, sku,
                         quantity, unit_price, line_total)
values ('99999999-9999-4999-8999-999999999999',
        'a0000001-0000-4000-8000-000000000001',
        'b0000001-0000-4000-8000-000000000001',
        'Aceite Anti-Estrías', 'GBL-ACE-115', 1, 5000, 5000);

-- =============================================================================
-- CATÁLOGO — visitante anónimo
-- =============================================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

select ok(
  (select count(*) from products) > 0,
  'ANÓNIMO sí puede leer el catálogo activo');

select is_empty(
  $$ select id from products where slug = 'sunscreen' $$,
  'ANÓNIMO no ve el Sunscreen: está en draft por decisión regulatoria');

select is_empty(
  $$ select id from products where slug = 'tonico-para-barba' $$,
  'ANÓNIMO no ve el Tónico Para Barba: está en draft');

select throws_ok(
  $$ insert into products (name, slug, base_price)
     values ('Pirata', 'pirata', 1) $$,
  '42501',
  null,
  'ANÓNIMO no puede crear productos');

select is_empty(
  $$ select id from orders $$,
  'ANÓNIMO no puede leer NINGÚN pedido');

select is_empty(
  $$ select code from coupons $$,
  'ANÓNIMO no puede listar cupones');

select throws_ok(
  $$ insert into newsletter_subscribers (email) values ('spam@test.com') $$,
  '42501',
  null,
  'ANÓNIMO no puede insertar en la newsletter: debe pasar por la API con rate limit');

reset role;

-- =============================================================================
-- CLIENTA A — no debe tocar precios ni ver pedidos ajenos
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true);
set local role authenticated;

-- RLS filtra la fila: la sentencia no falla, sencillamente no afecta a nada.
select lives_ok(
  $$ update products set base_price = 1 where slug = 'aceite-anti-estrias' $$,
  'El UPDATE de precio de una clienta no lanza error...');

reset role;

select is(
  (select base_price from products where slug = 'aceite-anti-estrias'),
  5000::bigint,
  '...pero el precio NO cambió: RLS filtró la fila');

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true);
set local role authenticated;

select is_empty(
  $$ select id from orders
      where id = '99999999-9999-4999-8999-999999999999' $$,
  'La clienta A NO puede ver el pedido de la clienta B');

select is_empty(
  $$ select id from order_items
      where order_id = '99999999-9999-4999-8999-999999999999' $$,
  'La clienta A tampoco ve las líneas de ese pedido');

select throws_ok(
  $$ insert into orders (user_id, customer_email, subtotal, grand_total)
     values ('11111111-1111-1111-1111-111111111111', 'x@test.com', 1, 1) $$,
  '42501',
  null,
  'Una clienta NO puede crear un pedido directamente: solo el servidor');

reset role;

-- =============================================================================
-- CLIENTA B — ve el suyo, pero no lo manipula
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true);
set local role authenticated;

select is(
  (select count(*)::int from orders),
  1,
  'La clienta B SÍ ve su propio pedido');

select lives_ok(
  $$ update orders set grand_total = 1, payment_status = 'paid'
      where id = '99999999-9999-4999-8999-999999999999' $$,
  'El intento de la clienta B de pagarse el pedido no lanza error...');

reset role;

select is(
  (select grand_total from orders
    where id = '99999999-9999-4999-8999-999999999999'),
  5800::bigint,
  '...pero el total NO cambió');

select is(
  (select payment_status::text from orders
    where id = '99999999-9999-4999-8999-999999999999'),
  'pending',
  '...y el pedido sigue SIN pagar: solo el webhook puede marcarlo');

select * from finish();
rollback;
