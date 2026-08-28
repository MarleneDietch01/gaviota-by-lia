-- =============================================================================
-- prod.sql — Catálogo real, ya aplicado en producción
-- =============================================================================
--
-- Subconjunto SEGURO PARA PRODUCCIÓN de dev.sql: solo categories/products/
-- product_variants/inventory_movements/product_related, con los mismos slugs
-- que ya usa `src/lib/catalog/products.ts` (el catálogo hardcodeado sigue
-- siendo la fuente de verdad para nombre/precio/descripciones que ve la
-- clienta; esto solo existe porque `reviews.product_id` necesita un uuid real
-- con foreign key a `products`, y esa tabla estaba vacía).
--
-- A diferencia de dev.sql, este archivo NO crea usuarios (`auth.users`) ni
-- toca `shipping_rates`/`content_sections`/`site_settings` — dev.sql crea 4
-- cuentas con contraseña pública conocida, incluidas dos admin/super_admin,
-- que jamás deben existir en la base de datos real.
--
-- Este archivo YA SE EJECUTÓ contra producción (2026-08-23, vía conexión
-- directa con `scripts/db-remote.mjs`/`DATABASE_URL`). Se documenta aquí para
-- que el estado de la base sea reproducible y quede en control de versiones,
-- no solo en un script suelto. Es idempotente (`on conflict ... do nothing`):
-- volver a correrlo no duplica ni sobrescribe nada.
--
-- Única corrección vs. dev.sql: Tónico Para Barba es 'active', no 'draft' —
-- su ingredientes/precauciones/modo de uso ya están confirmados y está en
-- venta (dev.sql predata esa confirmación; ver CONTENT_TODO.md C15).
--
-- `stock_quantity` son valores de prueba, no inventario real (CONTENT_TODO.md
-- C6) — igual que en dev.sql.
-- =============================================================================

begin;

insert into categories (id, name, slug, description, status, sort_order) values
  ('c0000001-0000-4000-8000-000000000001', 'Aceites y sérums', 'aceites-y-serums',
   'Texturas ligeras que se absorben y acompañan tu rutina diaria.', 'active', 1),
  ('c0000002-0000-4000-8000-000000000002', 'Cremas e hidratación', 'cremas-e-hidratacion',
   'Hidratación que se queda contigo durante todo el día.', 'active', 2),
  ('c0000003-0000-4000-8000-000000000003', 'Exfoliación', 'exfoliacion',
   'Prepara tu piel para que todo lo demás funcione mejor.', 'active', 3),
  ('c0000005-0000-4000-8000-000000000005', 'Cuidado masculino', 'cuidado-masculino',
   'Cuidado corporal pensado para ellos.', 'active', 5)
on conflict (id) do nothing;

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

  -- CORREGIDO vs. dev.sql: 'active', no 'draft' — contenido real ya confirmado
  -- (ingredientes, precauciones, modo de uso) y en venta hoy.
  --
  -- short_description/seo_description reescritos (2026-08-24) para que
  -- coincidan EXACTAMENTE con el shortDescription ES de src/lib/catalog/
  -- products.ts: los claims de crecimiento/anticaída capilar de la etiqueta
  -- original no se reproducen en ningún texto del sitio (ver el comentario
  -- de ese archivo, CONTENT_TODO C15, LEGAL_TODO L8).
  ('a0000006-0000-4000-8000-000000000006',
   'Tónico Para Barba', 'tonico-para-barba',
   'Acondiciona, suaviza y ayuda a domar la barba, con un aroma fresco de uso diario.',
   'GBL-TNB-000', 4000, 'active', false,
   'c0000005-0000-4000-8000-000000000005', true, '115 mL', null, true,
   'Tónico Para Barba | Gaviota by Lia',
   'Acondiciona, suaviza y ayuda a domar la barba, con un aroma fresco de uso diario.')
on conflict (id) do nothing;

insert into product_variants (id, product_id, name, sku, price, stock_quantity, low_stock_threshold, status)
values
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', '115 mL', 'GBL-ACE-115-V', 5000, 25, 5, 'active'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000002-0000-4000-8000-000000000002', '115 mL', 'GBL-ACM-115-V', 5000, 15, 5, 'active'),
  ('b0000003-0000-4000-8000-000000000003', 'a0000003-0000-4000-8000-000000000003', '236 mL', 'GBL-CRH-236-V', 4000, 30, 5, 'active'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004', '236 mL', 'GBL-EXF-236-V', 4000, 20, 5, 'active'),
  ('b0000005-0000-4000-8000-000000000005', 'a0000005-0000-4000-8000-000000000005', '59 mL',  'GBL-SVE-059-V', 4000,  3, 5, 'active'),
  ('b0000006-0000-4000-8000-000000000006', 'a0000006-0000-4000-8000-000000000006', '115 mL', 'GBL-TNB-115-V', 4000, 10, 5, 'active')
on conflict (id) do nothing;

insert into inventory_movements (product_id, variant_id, movement_type, quantity, previous_quantity, new_quantity, reason)
select v.product_id, v.id, 'initial', v.stock_quantity, 0, v.stock_quantity,
       'Carga inicial de catálogo (valores de stock de prueba, ver CONTENT_TODO.md C6)'
  from product_variants v
 where not exists (
   select 1 from inventory_movements m where m.variant_id = v.id and m.movement_type = 'initial'
 );

insert into product_related (product_id, related_id, relation, sort_order) values
  ('a0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003', 'complementary', 1),
  ('a0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001', 'complementary', 2),
  ('a0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'complementary', 1),
  ('a0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'complementary', 1),
  ('a0000001-0000-4000-8000-000000000001', 'a0000002-0000-4000-8000-000000000002', 'similar', 1)
on conflict do nothing;

-- Ingredientes (INCI), precauciones y modo de uso confirmados con la
-- documentación del fabricante (Maluhia Laboratorios). Espejo de la migración
-- 20260827120000_product_ingredients.sql para que un seed nuevo ya los traiga.
-- Solo los 3 productos con ficha recibida; el resto sigue pendiente (C1).
update products set
  ingredients_text = 'Sucrose, Prunus Amygdalus Dulcis Oil, Simmondsia Chinensis Seed Oil, Fragrance (Parfum), Cocos Nucifera Oil, Phenoxyethanol, Sodium Benzoate.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar en la piel húmeda una cantidad moderada y dar masajes circulares durante unos 3-5 minutos en el área deseada. Luego retirar con abundante agua. Para óptimos resultados, utilizar dos veces por semana.'
where slug = 'exfoliante-de-coco';

update products set
  ingredients_text = 'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragrance (Parfum), Glycine Soja Oil.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.'
where slug = 'aceite-anti-estrias';

update products set
  ingredients_text = 'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragrance (Parfum), Glycine Soja Oil.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar el spray sobre la barba limpia y seca, masajeando suavemente la piel para favorecer la absorción. Usar 1-2 veces al día de forma constante para mejores resultados.'
where slug = 'tonico-para-barba';

update products set
  ingredients_text = 'Aqua, Propylene Glycol, 3-O-Ethyl Ascorbic Acid, Tocopheryl Acetate, Polyisobutene, Polysorbate 20, Sorbitan Isostearate, Hyaluronic Acid, Xanthan Gum, Benzoic Acid, Sorbic Acid, Salicylic Acid, Lactic Acid, Citric Acid, Benzyl Alcohol, Sodium Polyacrylate.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, suspender su uso. Evitar el contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplique el producto después de la depilación para calmar la piel y prevenir los pelos encarnados.'
where slug = 'serum-vellos-encarnados';

commit;
