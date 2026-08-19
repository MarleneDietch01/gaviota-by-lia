-- =============================================================================
-- 0015_rls_policies.sql — Row Level Security
-- =============================================================================
-- RLS activado en TODAS las tablas. Sin política = sin acceso.
--
-- Esta es la TERCERA barrera de autorización, no la única:
--   1. middleware   -> redirige (experiencia, no seguridad)
--   2. Server Action/Component -> verifica el rol contra la BD
--   3. RLS          -> la base de datos rechaza lo que no corresponda
--
-- Es defensa en profundidad: aunque una consulta se escapara de la capa 2,
-- la base de datos no devolvería datos ajenos.
--
-- La service_role SALTA todas estas políticas por diseño. Por eso solo se usa
-- en servidor (webhooks, cron, operaciones administrativas) y src/lib/supabase/
-- admin.ts importa 'server-only' para que su uso en cliente rompa la compilación.
-- =============================================================================

alter table profiles               enable row level security;
alter table addresses              enable row level security;
alter table categories             enable row level security;
alter table products               enable row level security;
alter table product_variants       enable row level security;
alter table product_images         enable row level security;
alter table product_related        enable row level security;
alter table inventory_movements    enable row level security;
alter table carts                  enable row level security;
alter table cart_items             enable row level security;
alter table orders                 enable row level security;
alter table order_items            enable row level security;
alter table order_addresses        enable row level security;
alter table order_status_history   enable row level security;
alter table payments               enable row level security;
alter table payment_events         enable row level security;
alter table shipments              enable row level security;
alter table shipping_rates         enable row level security;
alter table coupons                enable row level security;
alter table coupon_redemptions     enable row level security;
alter table favorites              enable row level security;
alter table reviews                enable row level security;
alter table content_sections       enable row level security;
alter table faqs                   enable row level security;
alter table site_settings          enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages       enable row level security;
alter table email_log              enable row level security;
alter table audit_logs             enable row level security;


-- =============================================================================
-- PERFILES
-- =============================================================================
-- El cliente lee y edita el SUYO. No puede cambiar role ni status: lo impide el
-- trigger prevent_role_escalation (0003), porque WITH CHECK no puede comparar
-- el valor nuevo con el anterior.
-- =============================================================================
create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid() or is_admin());

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- Sin INSERT: los perfiles los crea el trigger on_auth_user_created.
-- Sin DELETE: se borra auth.users y cae en cascada.


-- =============================================================================
-- DIRECCIONES
-- =============================================================================
create policy addresses_all_own on addresses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy addresses_admin_read on addresses
  for select to authenticated
  using (is_admin());


-- =============================================================================
-- CATÁLOGO — lectura pública solo de lo activo
-- =============================================================================
-- anon y authenticated ven únicamente status = 'active'. Un producto en 'draft'
-- o 'archived' es invisible para el público aunque se conozca su id.
-- =============================================================================
create policy categories_public_read on categories
  for select to anon, authenticated
  using (status = 'active');

create policy categories_admin_all on categories
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy products_public_read on products
  for select to anon, authenticated
  using (status = 'active');

create policy products_admin_all on products
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- Las variantes heredan la visibilidad del producto padre.
create policy product_variants_public_read on product_variants
  for select to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from products p
       where p.id = product_variants.product_id and p.status = 'active'
    )
  );

create policy product_variants_admin_all on product_variants
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_images_public_read on product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
       where p.id = product_images.product_id and p.status = 'active'
    )
  );

create policy product_images_admin_all on product_images
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_related_public_read on product_related
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
       where p.id = product_related.related_id and p.status = 'active'
    )
  );

create policy product_related_admin_all on product_related
  for all to authenticated
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- INVENTARIO — libro mayor inmutable
-- =============================================================================
-- Los clientes NO tienen ningún acceso: el stock disponible se expone a través
-- de product_variants, no de los movimientos.
--
-- Ni siquiera un administrador puede UPDATE o DELETE: un error se corrige con
-- un movimiento de ajuste. Un libro mayor editable no es un libro mayor.
-- =============================================================================
create policy inventory_movements_admin_read on inventory_movements
  for select to authenticated
  using (is_admin());

-- Sin políticas de INSERT/UPDATE/DELETE: los asientos los escriben las funciones
-- security definer de 0014, que corren con los privilegios del propietario.


-- =============================================================================
-- CARRITOS
-- =============================================================================
-- El carrito anónimo NO se cubre con RLS: se identifica por una cookie httpOnly
-- que el navegador no puede leer, así que se gestiona en servidor con la
-- service_role. Exponerlo vía RLS obligaría a enviar el id de sesión al cliente.
-- =============================================================================
create policy carts_own on carts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy carts_admin_read on carts
  for select to authenticated
  using (is_admin());

create policy cart_items_own on cart_items
  for all to authenticated
  using (
    exists (
      select 1 from carts c
       where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from carts c
       where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy cart_items_admin_read on cart_items
  for select to authenticated
  using (is_admin());


-- =============================================================================
-- PEDIDOS — el cliente LEE los suyos y nada más
-- =============================================================================
-- SIN INSERT. SIN UPDATE. SIN DELETE para clientes.
--
-- Los pedidos se crean exclusivamente mediante Server Actions con la service_role,
-- tras recalcular todos los importes en servidor. Es la aplicación estricta de
-- "un cliente no puede modificar totales ni cambiar estados de pedidos".
--
-- Un usuario ANÓNIMO no tiene ninguna política de lectura: el acceso público a
-- un pedido va por public_token verificado en servidor, nunca por RLS.
-- =============================================================================
create policy orders_select_own on orders
  for select to authenticated
  using (user_id = auth.uid());

create policy orders_admin_all on orders
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy order_items_select_own on order_items
  for select to authenticated
  using (
    exists (
      select 1 from orders o
       where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy order_items_admin_all on order_items
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy order_addresses_select_own on order_addresses
  for select to authenticated
  using (
    exists (
      select 1 from orders o
       where o.id = order_addresses.order_id and o.user_id = auth.uid()
    )
  );

create policy order_addresses_admin_all on order_addresses
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy order_status_history_select_own on order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from orders o
       where o.id = order_status_history.order_id and o.user_id = auth.uid()
    )
  );

create policy order_status_history_admin_read on order_status_history
  for select to authenticated
  using (is_admin());


-- =============================================================================
-- PAGOS — ningún acceso para clientes
-- =============================================================================
-- Ni siquiera de sus propios pagos. El estado del pago se muestra desde
-- orders.payment_status, que sí es legible. Los identificadores del proveedor,
-- las claves de idempotencia y los payloads no tienen por qué salir del servidor.
-- =============================================================================
create policy payments_admin_read on payments
  for select to authenticated
  using (is_admin());

create policy payment_events_admin_read on payment_events
  for select to authenticated
  using (is_admin());

-- Escritura: solo la service_role desde el manejador del webhook.


-- =============================================================================
-- ENVÍOS
-- =============================================================================
create policy shipments_select_own on shipments
  for select to authenticated
  using (
    exists (
      select 1 from orders o
       where o.id = shipments.order_id and o.user_id = auth.uid()
    )
  );

create policy shipments_admin_all on shipments
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- Las tarifas son públicas: el checkout las necesita para mostrar opciones.
create policy shipping_rates_public_read on shipping_rates
  for select to anon, authenticated
  using (status = 'active');

create policy shipping_rates_admin_all on shipping_rates
  for all to authenticated
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- CUPONES — ningún acceso directo para clientes
-- =============================================================================
-- Si los cupones fueran legibles, cualquiera podría listar la tabla y usar
-- códigos que no le corresponden. La validación pasa siempre por
-- calculate_coupon_discount() en servidor.
-- =============================================================================
create policy coupons_admin_all on coupons
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy coupon_redemptions_select_own on coupon_redemptions
  for select to authenticated
  using (user_id = auth.uid());

create policy coupon_redemptions_admin_all on coupon_redemptions
  for all to authenticated
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- FAVORITOS
-- =============================================================================
create policy favorites_own on favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- =============================================================================
-- RESEÑAS
-- =============================================================================
-- Público: solo las aprobadas. El autor ve además la suya pendiente.
--
-- Al crear, WITH CHECK fuerza status = 'pending' y verified_purchase = false:
-- un cliente no puede autoaprobarse una reseña ni marcarse la compra como
-- verificada. Ambos los ajusta el servidor.
-- =============================================================================
create policy reviews_public_read on reviews
  for select to anon, authenticated
  using (status = 'approved');

create policy reviews_select_own on reviews
  for select to authenticated
  using (user_id = auth.uid());

create policy reviews_insert_own on reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and verified_purchase = false
  );

create policy reviews_update_own on reviews
  for update to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and verified_purchase = false
  );

create policy reviews_delete_own on reviews
  for delete to authenticated
  using (user_id = auth.uid());

create policy reviews_admin_all on reviews
  for all to authenticated
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- CONTENIDO — lectura pública solo de lo activo
-- =============================================================================
-- status <> 'active' => invisible en producción. Este es el mecanismo por el
-- que las secciones sin datos reales (testimonios, UGC) no se renderizan, sin
-- necesidad de una condición en el código.
-- =============================================================================
create policy content_sections_public_read on content_sections
  for select to anon, authenticated
  using (status = 'active');

create policy content_sections_admin_all on content_sections
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy faqs_public_read on faqs
  for select to anon, authenticated
  using (status = 'active');

create policy faqs_admin_all on faqs
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- site_settings: ningún acceso para clientes. Contiene datos operativos del
-- negocio. El storefront los lee en servidor.
create policy site_settings_admin_all on site_settings
  for all to authenticated
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- COMUNICACIONES — escritura por servidor, lectura por administración
-- =============================================================================
-- Sin INSERT público: si anon pudiera insertar directamente, se saltaría el
-- rate limiting y el antispam de las Route Handlers. Ambos formularios pasan
-- por /api/newsletter y /api/contact.
-- =============================================================================
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated
  using (is_admin());

create policy newsletter_admin_write on newsletter_subscribers
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy contact_messages_admin_all on contact_messages
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy email_log_admin_read on email_log
  for select to authenticated
  using (is_admin());


-- =============================================================================
-- AUDITORÍA — solo super_admin, y solo lectura
-- =============================================================================
-- Sin UPDATE ni DELETE para nadie: un registro de auditoría que puede
-- modificarse no sirve como registro de auditoría.
-- =============================================================================
create policy audit_logs_super_admin_read on audit_logs
  for select to authenticated
  using (is_super_admin());


-- =============================================================================
-- Revocación de permisos base
-- =============================================================================
-- Cinturón y tirantes: aunque una política dijera lo contrario, estos roles no
-- tienen el privilegio SQL subyacente sobre las tablas más sensibles.
-- =============================================================================
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

-- Nada de esto aplica a la service_role, que salta RLS por diseño.
