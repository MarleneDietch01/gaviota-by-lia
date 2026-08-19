-- =============================================================================
-- 0001_extensions.sql — Extensiones
-- =============================================================================

-- citext: texto insensible a mayúsculas.
-- Se usa en correos y códigos de cupón: "BIENVENIDA10" y "bienvenida10" deben
-- ser el mismo cupón, y Ana@correo.com el mismo usuario que ana@correo.com.
create extension if not exists citext with schema extensions;

-- pgcrypto: gen_random_bytes() para los tokens públicos de pedido y de baja
-- de newsletter. gen_random_uuid() ya es nativa desde PostgreSQL 13.
create extension if not exists pgcrypto with schema extensions;

-- Índices trigram para la búsqueda de productos por coincidencia parcial.
create extension if not exists pg_trgm with schema extensions;
