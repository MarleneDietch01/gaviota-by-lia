-- =============================================================================
-- 20260825220000_translation_stale.sql — Aviso de traducción desactualizada
-- =============================================================================
-- El catálogo migró a Supabase, pero el inglés sigue siendo un mapa manual en
-- código (`ENGLISH` en src/lib/catalog/products.ts) — no hay columnas `*_en`
-- en `products` (decisión documentada en ese archivo). Sin esta columna, editar
-- el español desde /admin/products deja el inglés desincronizado EN SILENCIO:
-- nadie se entera hasta que una clienta lee una descripción vieja.
--
-- `translation_stale` se enciende automáticamente cada vez que se guarda un
-- campo traducible en español (ver `updateProduct()` en
-- src/app/admin/(dashboard)/products/actions.ts) y solo se apaga cuando
-- alguien confirma a mano que actualizó el `ENGLISH` map y lo desplegó — no
-- hay forma de que el sistema lo apague solo, porque el propio texto en
-- inglés vive fuera de la base de datos.
-- =============================================================================

alter table products
  add column translation_stale boolean not null default false;

comment on column products.translation_stale is
  'true cuando el español se editó después de la última vez que alguien '
  'confirmó que el override en inglés (ENGLISH, en código) sigue vigente. '
  'Bloquea el aviso "traducción pendiente" en /admin/products y oculta el '
  'inglés desactualizado con el mismo aviso de "ficha en ampliación" que ya '
  'usa el catálogo, en vez de servirlo tal cual a una clienta.';
