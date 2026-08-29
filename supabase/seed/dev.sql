-- =============================================================================
-- dev.sql — Datos SEED EXCLUSIVOS DE DESARROLLO
-- =============================================================================
--
--   ⚠️  ESTE ARCHIVO NO SE EJECUTA NUNCA EN PRODUCCIÓN.  ⚠️
--
-- Contiene usuarios con contraseñas conocidas y textos de producto marcados
-- como provisionales. Ejecutarlo contra la base de datos de producción crearía
-- cuentas administrativas con credenciales públicas.
--
-- -----------------------------------------------------------------------------
-- PROCEDENCIA DE LOS DATOS
-- -----------------------------------------------------------------------------
-- Nombres, precios y tamaños: verificados en la auditoría del sitio Shopify
-- (/products.json) y en la lectura directa de las etiquetas de GA9.jpg.
--
-- NO se incluye ningún dato inventado. En concreto, quedan NULL a propósito:
--   · ingredients_text   -> pendiente (CONTENT_TODO.md C1)
--   · precautions        -> pendiente (C2)
--   · usage_instructions -> salvo los 2 productos que sí lo tienen (C3)
--   · weight_grams       -> pendiente de pesar (C7)
--   · compare_at_price   -> pendiente la decisión de precios (C4)
--   · stock_quantity     -> valores de prueba, NO el inventario real (C6)
--
-- El descuento permanente del sitio actual NO se replica: la restricción
-- compare_at_needs_dates lo impediría de todos modos.
-- =============================================================================

begin;

-- Salvaguarda: aborta si la base tiene pedidos reales.
do $$
begin
  if exists (select 1 from orders limit 1) then
    raise exception
      'ABORTADO: la base de datos contiene pedidos. Los seeds son solo para desarrollo.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Usuarios de prueba
-- -----------------------------------------------------------------------------
-- Las contraseñas son públicas y conocidas. Solo desarrollo.
-- El trigger on_auth_user_created crea el perfil con rol 'customer'; después se
-- promociona a los administradores, que es justamente lo que un cliente NO puede
-- hacer por sí mismo (lo bloquea prevent_role_escalation).
-- -----------------------------------------------------------------------------
-- confirmation_token, recovery_token, email_change_token_new y email_change se
-- fijan a '' explícitamente: no tienen default en auth.users y GoTrue >= 2.19x
-- falla al escanear NULL en esas columnas ("converting NULL to string is
-- unsupported"), lo que rompe TODO inicio de sesión con estos usuarios.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'cliente.a@ejemplo.test',
   extensions.crypt('DevPassword123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Ana","last_name":"Cliente"}'::jsonb,
   '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'cliente.b@ejemplo.test',
   extensions.crypt('DevPassword123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Beatriz","last_name":"Cliente"}'::jsonb,
   '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000',
   '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'admin@ejemplo.test',
   extensions.crypt('DevPassword123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Admin","last_name":"Gaviota"}'::jsonb,
   '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000',
   '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
   'superadmin@ejemplo.test',
   extensions.crypt('DevPassword123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Super","last_name":"Admin"}'::jsonb,
   '', '', '', '')
on conflict (id) do nothing;

-- auth.identities: sin una fila 'email' aquí, signInWithPassword de gotrue-js
-- no resuelve al usuario y algunos flujos (getUserByEmail) fallan.
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select id::text, id,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users
 where email like '%@ejemplo.test'
on conflict (provider, provider_id) do nothing;

-- Promoción de roles (solo posible con service_role / propietario).
update profiles set role = 'admin'
 where id = '33333333-3333-3333-3333-333333333333';
update profiles set role = 'super_admin'
 where id = '44444444-4444-4444-4444-444444444444';

-- -----------------------------------------------------------------------------
-- Categorías
-- -----------------------------------------------------------------------------
insert into categories (id, name, slug, description, status, sort_order) values
  ('c0000001-0000-4000-8000-000000000001', 'Aceites y sérums', 'aceites-y-serums',
   'Texturas ligeras que se absorben y acompañan tu rutina diaria.', 'active', 1),
  ('c0000002-0000-4000-8000-000000000002', 'Cremas e hidratación', 'cremas-e-hidratacion',
   'Hidratación que se queda contigo durante todo el día.', 'active', 2),
  ('c0000003-0000-4000-8000-000000000003', 'Exfoliación', 'exfoliacion',
   'Prepara tu piel para que todo lo demás funcione mejor.', 'active', 3),
  ('c0000004-0000-4000-8000-000000000004', 'Kits', 'kits',
   'Tu rutina completa, en una sola caja.', 'active', 4),
  ('c0000005-0000-4000-8000-000000000005', 'Cuidado masculino', 'cuidado-masculino',
   'Cuidado corporal pensado para ellos.', 'draft', 5)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Productos
-- -----------------------------------------------------------------------------
-- short_description procede de los claims IMPRESOS EN EL ENVASE, que son
-- cosméticos y están mejor redactados que la web actual.
-- Las descripciones largas quedan NULL: se redactan tras aprobar los claims
-- (LEGAL_TODO.md L8).
-- -----------------------------------------------------------------------------
insert into products (
  id, name, slug, short_description, sku, base_price, status, featured,
  category_id, track_inventory, size_label, usage_instructions,
  requires_disclaimer, seo_title, seo_description
) values
  ('a0000001-0000-4000-8000-000000000001',
   'Aceite Anti-Estrías', 'aceite-anti-estrias',
   'Reafirmante, hidratante y aporta brillo.',
   'GBL-ACE-115', 5000, 'active', true,
   'c0000001-0000-4000-8000-000000000001', true, '115 mL', null, true,
   'Aceite Anti-Estrías 115 mL | Gaviota by Lia',
   'Aceite corporal reafirmante e hidratante que ayuda a mejorar la apariencia de la piel.'),

  ('a0000002-0000-4000-8000-000000000002',
   'Aceite Anti-Estrías Masculino', 'aceite-anti-estrias-masculino',
   'Reafirmante, hidratante y aporta brillo.',
   'GBL-ACM-115', 5000, 'active', false,
   'c0000001-0000-4000-8000-000000000001', true, '115 mL', null, true,
   'Aceite Anti-Estrías Masculino 115 mL | Gaviota by Lia',
   'Aceite corporal reafirmante e hidratante formulado para ellos.'),

  ('a0000003-0000-4000-8000-000000000003',
   'Crema Hidratante', 'crema-hidratante',
   'Hidratación profunda de rápida absorción.',
   'GBL-CRH-236', 4000, 'active', true,
   'c0000002-0000-4000-8000-000000000002', true, '236 mL', null, true,
   'Crema Hidratante 236 mL | Gaviota by Lia',
   'Crema corporal que contribuye a mantener la piel hidratada y suave.'),

  ('a0000004-0000-4000-8000-000000000004',
   'Exfoliante de Coco', 'exfoliante-de-coco',
   'Exfoliación suave con aroma a coco.',
   'GBL-EXF-236', 4000, 'active', true,
   'c0000003-0000-4000-8000-000000000003', true, '236 mL',
   -- Único modo de uso verificado del catálogo actual.
   'Aplica sobre la piel húmeda realizando suaves movimientos circulares. '
   'Enjuaga con agua tibia. Úsalo de 2 a 3 veces por semana.',
   true,
   'Exfoliante de Coco 236 mL | Gaviota by Lia',
   'Exfoliante corporal que ayuda a suavizar la textura de la piel.'),

  ('a0000005-0000-4000-8000-000000000005',
   'Sérum Vellos Encarnados', 'serum-vellos-encarnados',
   'Cuidado de la piel después de la depilación.',
   'GBL-SVE-059', 4000, 'active', false,
   'c0000001-0000-4000-8000-000000000001', true, '59 mL',
   'Aplica el producto después de la depilación para calmar la piel.',
   true,
   'Sérum Vellos Encarnados 59 mL | Gaviota by Lia',
   'Sérum que ayuda a reducir la apariencia de los vellos encarnados tras la depilación.'),

  -- Tónico Para Barba: 'draft'. Sin contenido, sin fotografía disponible y con
  -- claims de crecimiento capilar pendientes de reescritura (CONTENT_TODO.md C15).
  ('a0000006-0000-4000-8000-000000000006',
   'Tónico Para Barba', 'tonico-para-barba',
   null,
   'GBL-TNB-000', 4000, 'draft', false,
   'c0000005-0000-4000-8000-000000000005', true, null, null, true,
   null, null),

  -- Sunscreen: 'draft' POR DECISIÓN APROBADA.
  -- En EE. UU. un protector solar es medicamento OTC (FDA), no cosmético.
  -- No se publica sin documentación del fabricante (LEGAL_TODO.md L2).
  ('a0000007-0000-4000-8000-000000000007',
   'Sunscreen', 'sunscreen',
   null,
   'GBL-SUN-059', 3000, 'draft', false,
   null, true, '59 mL', null, true,
   null, null),

  -- Kit. NO se destaca el ahorro: son 10 USD sobre 130 (7,7 %), por decisión
  -- aprobada se presenta como rutina completa, no como oferta.
  ('a0000008-0000-4000-8000-000000000008',
   'Kit Rutina Completa', 'kit-rutina-completa',
   'Tu rutina completa: exfolia, hidrata y nutre.',
   'GBL-KIT-001', 12000, 'active', true,
   'c0000004-0000-4000-8000-000000000004', true, null, null, true,
   'Kit Rutina Completa | Gaviota by Lia',
   'Exfoliante, crema hidratante y aceite corporal en un solo kit.')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Variantes
-- -----------------------------------------------------------------------------
-- Todos los productos tienen una sola presentación hoy, pero el modelo con
-- variantes evita rehacer el esquema cuando se añada un segundo tamaño.
--
-- stock_quantity: valores de PRUEBA. El inventario real está pendiente (C6).
-- -----------------------------------------------------------------------------
insert into product_variants (id, product_id, name, sku, price, stock_quantity, low_stock_threshold, status)
values
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', '115 mL', 'GBL-ACE-115-V', 5000, 25, 5, 'active'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000002-0000-4000-8000-000000000002', '115 mL', 'GBL-ACM-115-V', 5000, 15, 5, 'active'),
  ('b0000003-0000-4000-8000-000000000003', 'a0000003-0000-4000-8000-000000000003', '236 mL', 'GBL-CRH-236-V', 4000, 30, 5, 'active'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004', '236 mL', 'GBL-EXF-236-V', 4000, 20, 5, 'active'),
  ('b0000005-0000-4000-8000-000000000005', 'a0000005-0000-4000-8000-000000000005', '59 mL',  'GBL-SVE-059-V', 4000,  3, 5, 'active'),
  ('b0000006-0000-4000-8000-000000000006', 'a0000006-0000-4000-8000-000000000006', 'Único',  'GBL-TNB-000-V', 4000, 10, 5, 'active'),
  ('b0000007-0000-4000-8000-000000000007', 'a0000007-0000-4000-8000-000000000007', '59 mL',  'GBL-SUN-059-V', 3000, 12, 5, 'active'),
  ('b0000008-0000-4000-8000-000000000008', 'a0000008-0000-4000-8000-000000000008', 'Kit',    'GBL-KIT-001-V', 12000, 8, 3, 'active')
on conflict (id) do nothing;

-- Asiento inicial de inventario, coherente con el libro mayor.
insert into inventory_movements (product_id, variant_id, movement_type, quantity, previous_quantity, new_quantity, reason)
select v.product_id, v.id, 'initial', v.stock_quantity, 0, v.stock_quantity,
       'Carga inicial de desarrollo (NO es el inventario real)'
  from product_variants v
 where not exists (
   select 1 from inventory_movements m where m.variant_id = v.id and m.movement_type = 'initial'
 );

-- -----------------------------------------------------------------------------
-- Productos complementarios (definidos a mano, no por algoritmo)
-- -----------------------------------------------------------------------------
insert into product_related (product_id, related_id, relation, sort_order) values
  ('a0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003', 'complementary', 1),
  ('a0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001', 'complementary', 2),
  ('a0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'complementary', 1),
  ('a0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'complementary', 1),
  ('a0000001-0000-4000-8000-000000000001', 'a0000002-0000-4000-8000-000000000002', 'similar', 1)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Tarifa de envío de DESARROLLO
-- -----------------------------------------------------------------------------
-- Los plazos (2 días de proceso + 3-4 de entrega = 5-6) SÍ son reales: constan
-- en la política de envíos del sitio actual.
-- El importe y el umbral son de prueba: los reales están pendientes
-- (SHIPPING_TODO.md).
-- -----------------------------------------------------------------------------
insert into shipping_rates (name, country, rate, free_above, estimated_days_min, estimated_days_max, status)
values ('USPS Priority Mail (DESARROLLO)', 'US', 800, 7500, 5, 6, 'active')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Contenido del home
-- -----------------------------------------------------------------------------
-- Textos aprobados en la Fase 2. Las secciones sin datos reales quedan en
-- 'draft', de modo que NO se renderizan en producción.
-- -----------------------------------------------------------------------------
insert into content_sections (section_key, title, subtitle, body, button_label, button_url, status, sort_order)
values
  ('home.announcement', 'Envíos con seguimiento en todos los pedidos', null, null, null, null, 'active', 1),

  ('home.hero',
   'Tu piel. Tu ritual. Tu momento.',
   'Cuidado corporal inspirado en la belleza dominicana',
   'Cuidado corporal creado para hidratar, suavizar y convertir cada aplicación en un momento para ti.',
   'Descubrir la colección', '/shop', 'active', 2),

  ('home.trust', 'Compra con confianza', null, null, null, null, 'active', 3),

  ('home.bestsellers',
   'Los que todas quieren en su rutina.',
   'Descubre los favoritos que se han convertido en parte del cuidado diario de nuestra comunidad.',
   null, 'Ver todos', '/shop', 'active', 4),

  ('home.needs', '¿Qué quieres cuidar hoy?', null, null, null, null, 'active', 5),

  ('home.campaign', 'Suavidad que se convierte en ritual.', null, null,
   'Conocer el producto', '/products/exfoliante-de-coco', 'active', 6),

  ('home.ritual', 'Tu ritual empieza aquí.', null, null, 'Ver la rutina', '/routine', 'active', 7),

  ('home.kits', 'Tu rutina completa, en un solo kit.', null, null, 'Ver los kits', '/kits', 'active', 8),

  ('home.story', 'Belleza dominicana hecha ritual.', null, null,
   'Conocer nuestra historia', '/our-story', 'active', 9),

  ('home.community', 'Así se vive Gaviota.', null, null, null, null, 'active', 10),

  ('home.newsletter', 'Únete a la comunidad', null,
   'Recibe novedades, rituales y lanzamientos antes que nadie.', null, null, 'active', 11),

  -- OCULTAS EN PRODUCCIÓN: no hay ni una sola reseña ni material de clientas
  -- autorizado. status = 'draft' hace que no se rendericen.
  ('home.testimonials', 'Lo que dicen nuestras clientas', null, null, null, null, 'draft', 12),
  ('home.ugc',          'Contenido de la comunidad',     null, null, null, null, 'draft', 13),
  ('home.instagram',    'Síguenos en Instagram',         null, null,
   'Ver más en Instagram', 'https://www.instagram.com/gaviotabylia/', 'draft', 14)
on conflict (section_key) do nothing;

-- -----------------------------------------------------------------------------
-- Ajustes del sitio
-- -----------------------------------------------------------------------------
-- Solo datos VERIFICADOS en la auditoría. El nombre legal, la dirección y el
-- horario quedan pendientes (LEGAL_TODO.md L1, CONTENT_TODO.md C13).
-- -----------------------------------------------------------------------------
insert into site_settings (setting_key, setting_value, description) values
  ('business.name',      '"Gaviota by Lia"'::jsonb,            'Nombre comercial'),
  ('business.email',     '"gaviotabylia@gmail.com"'::jsonb,    'PENDIENTE: migrar a dominio propio'),
  ('business.phone',     '"401-305-8713"'::jsonb,              'Verificado en el sitio actual'),
  ('business.currency',  '"USD"'::jsonb,                       'Moneda única del MVP'),
  ('social.instagram',   '"https://www.instagram.com/gaviotabylia/"'::jsonb, 'Única red social existente'),
  ('features.journal_enabled',      'false'::jsonb, 'El blog actual está vacío: no se enlaza hasta tener 3 artículos'),
  ('features.reviews_enabled',      'true'::jsonb,  'Sistema activo; la interfaz aparece sola al haber reseñas aprobadas'),
  ('features.instagram_feed',       'false'::jsonb, 'Requiere token de API'),
  ('seo.default_title',       '"Gaviota by Lia | Cuidado corporal dominicano"'::jsonb, null),
  ('seo.default_description', '"Rituales de cuidado corporal creados para hidratar, suavizar y acompañar cada etapa de tu piel."'::jsonb, null)
on conflict (setting_key) do nothing;

commit;

-- =============================================================================
-- Credenciales de desarrollo (públicas, solo local)
-- =============================================================================
--   cliente.a@ejemplo.test    / DevPassword123!   customer
--   cliente.b@ejemplo.test    / DevPassword123!   customer
--   admin@ejemplo.test        / DevPassword123!   admin
--   superadmin@ejemplo.test   / DevPassword123!   super_admin
-- =============================================================================
