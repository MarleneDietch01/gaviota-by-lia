-- =============================================================================
-- 0..._grant_table_privileges.sql — Privilegios SQL base para anon/authenticated
-- =============================================================================
-- Una política RLS solo entra en juego si el rol tiene ADEMÁS el privilegio SQL
-- sobre la tabla. Las versiones recientes de PostgreSQL/Supabase ya no conceden
-- esos privilegios por defecto en el esquema public: el `ALTER DEFAULT
-- PRIVILEGES` de `postgres` ahora solo da REFERENCES/TRIGGER/TRUNCATE a
-- anon/authenticated/service_role, no SELECT/INSERT/UPDATE/DELETE. Sin estos
-- GRANT, TODA consulta —el storefront leyendo productos como anon, el webhook
-- creando el pedido como service_role— falla con "permission denied for table"
-- antes de que RLS filtre una sola fila, y las políticas de 0015 quedan
-- inertes.
--
-- Modelo de Supabase: se concede el privilegio de tabla y RLS (0015) decide qué
-- filas. La service_role salta RLS por diseño y necesita acceso total.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Se vuelven a cerrar las tablas sensibles que el GRANT de arriba reabrió.
-- Es exactamente el bloque final de 0015, repetido porque `all tables` no
-- distingue: el libro mayor de inventario, los pagos y la auditoría no son
-- legibles por el cliente ni con RLS de por medio.
-- ---------------------------------------------------------------------------
revoke all on payments            from anon, authenticated;
revoke all on payment_events      from anon, authenticated;
revoke all on audit_logs          from anon, authenticated;
revoke all on site_settings       from anon, authenticated;
revoke all on inventory_movements from anon, authenticated;

grant select on payments            to authenticated;
grant select on payment_events      to authenticated;
grant select on audit_logs          to authenticated;
grant select, insert, update, delete on site_settings to authenticated;
grant select on inventory_movements to authenticated;

-- profiles: el cliente nunca inserta ni borra su perfil (0015: lo crea un
-- trigger, se borra en cascada con auth.users).
revoke insert, delete on profiles from authenticated;

-- ---------------------------------------------------------------------------
-- Funciones security definer server-only.
-- ---------------------------------------------------------------------------
-- 0014 hace `revoke execute ... from anon, authenticated`, pero PostgreSQL
-- concede EXECUTE a PUBLIC por defecto y ese grant seguía intacto: cualquier
-- usuario autenticado podía llamar a reserve_inventory() y reservar (agotar)
-- el catálogo entero, o sondear códigos con calculate_coupon_discount(). Hay
-- que quitárselo a PUBLIC y dejarlo solo en la service_role (servidor).
-- ---------------------------------------------------------------------------
-- generate_order_number() se deja como está: es un default de columna en
-- `orders`, así que revocárselo a authenticated rompería cualquier INSERT que
-- pase por ese default. Es inofensivo (order_number "NO autoriza": es
-- secuencial y predecible por diseño).
revoke execute on function reserve_inventory(uuid, int, uuid)        from public, anon, authenticated;
revoke execute on function release_reservation(uuid)                 from public, anon, authenticated;
revoke execute on function commit_inventory_sale(uuid)               from public, anon, authenticated;
revoke execute on function expire_stale_reservations()               from public, anon, authenticated;
revoke execute on function calculate_coupon_discount(text, bigint, uuid) from public, anon, authenticated;

grant execute on function reserve_inventory(uuid, int, uuid)         to service_role;
grant execute on function release_reservation(uuid)                  to service_role;
grant execute on function commit_inventory_sale(uuid)               to service_role;
grant execute on function expire_stale_reservations()               to service_role;
grant execute on function calculate_coupon_discount(text, bigint, uuid) to service_role;
