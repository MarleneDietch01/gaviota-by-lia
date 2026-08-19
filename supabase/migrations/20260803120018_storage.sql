-- =============================================================================
-- 0018_storage.sql — Buckets de Storage y sus políticas
-- =============================================================================
-- Los buckets son públicos en LECTURA (las imágenes de producto tienen que
-- servirse a cualquier visitante) pero la ESCRITURA está restringida a
-- administradores. Un bucket con escritura abierta es un alojamiento gratuito
-- para cualquiera que encuentre la URL.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'products', 'products', true,
    10485760,                                   -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'content', 'content', true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'categories', 'categories', true,
    5242880,                                    -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
on conflict (id) do nothing;

-- El límite de 10 MB es deliberado: las fotografías originales del proyecto
-- pesan entre 7 y 27 MB y NUNCA deben subirse sin procesar. Servir un JPEG de
-- 27 MB haría inalcanzable cualquier objetivo de LCP. Los derivados procesados
-- quedan muy por debajo del límite.

-- -----------------------------------------------------------------------------
-- Lectura pública
-- -----------------------------------------------------------------------------
create policy "storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('products', 'content', 'categories'));

-- -----------------------------------------------------------------------------
-- Escritura solo para administradores
-- -----------------------------------------------------------------------------
create policy "storage_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('products', 'content', 'categories') and is_admin());

create policy "storage_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('products', 'content', 'categories') and is_admin())
  with check (bucket_id in ('products', 'content', 'categories') and is_admin());

create policy "storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('products', 'content', 'categories') and is_admin());
