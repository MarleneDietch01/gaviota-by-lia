-- =============================================================================
-- 02_rls_identity.test.sql — Perfiles, roles y escalada de privilegios
-- =============================================================================
-- Simula usuarios reales fijando request.jwt.claims y cambiando de rol de
-- Postgres, que es exactamente lo que hace PostgREST al recibir una petición
-- con la clave anónima. Sin `set local role` las pruebas correrían como
-- propietario, que ignora RLS, y pasarían todas sin demostrar nada.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- IDs de los seeds de desarrollo
\set customer_a '11111111-1111-1111-1111-111111111111'
\set customer_b '22222222-2222-2222-2222-222222222222'
\set admin_id   '33333333-3333-3333-3333-333333333333'
\set super_id   '44444444-4444-4444-4444-444444444444'

-- =============================================================================
-- ANÓNIMO
-- =============================================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

select is_empty(
  $$ select id from profiles $$,
  'ANÓNIMO no puede leer ningún perfil');

reset role;

-- =============================================================================
-- CLIENTA A
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true);
set local role authenticated;

select is(
  (select count(*)::int from profiles),
  1,
  'La clienta A solo ve UN perfil: el suyo');

select is(
  (select id from profiles),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Y ese perfil es efectivamente el suyo');

select is_empty(
  $$ select id from profiles
      where id = '22222222-2222-2222-2222-222222222222' $$,
  'La clienta A NO puede leer el perfil de la clienta B');

select lives_ok(
  $$ update profiles set first_name = 'Ana María'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'La clienta A SÍ puede editar su propio nombre');

-- El ataque más importante de esta suite.
select throws_ok(
  $$ update profiles set role = 'admin'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'La clienta A NO puede ascenderse a admin (prevent_role_escalation)');

select throws_ok(
  $$ update profiles set role = 'super_admin'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'Tampoco a super_admin');

-- 'suspended' es un cambio real frente al 'active' del seed: `is distinct
-- from` compara valores, así que un no-op (status = 'active') no dispararía
-- el trigger y no probaría nada.
select throws_ok(
  $$ update profiles set status = 'suspended'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'La clienta A NO puede cambiar su propio estado de cuenta');

select is(
  (select role::text from profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  'customer',
  'Tras los intentos, su rol sigue siendo customer');

select is(
  (select is_admin()),
  false,
  'is_admin() devuelve false para una clienta');

-- Direcciones
select lives_ok(
  $$ insert into addresses (user_id, recipient_name, address_line_1, city, country)
     values ('11111111-1111-1111-1111-111111111111', 'Ana', 'Calle 1', 'Santo Domingo', 'DO') $$,
  'La clienta A puede crear su propia dirección');

select throws_ok(
  $$ insert into addresses (user_id, recipient_name, address_line_1, city, country)
     values ('22222222-2222-2222-2222-222222222222', 'Beatriz', 'Calle 2', 'Santiago', 'DO') $$,
  '42501',
  null,
  'La clienta A NO puede crear una dirección a nombre de la clienta B');

reset role;

-- =============================================================================
-- ADMINISTRADOR
-- =============================================================================
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true);
set local role authenticated;

select is(
  (select is_admin()),
  true,
  'is_admin() devuelve true para un administrador');

select ok(
  (select count(*) from profiles) >= 4,
  'El administrador sí ve todos los perfiles');

reset role;

select * from finish();
rollback;
