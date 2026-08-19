-- =============================================================================
-- 0005_inventory.sql — Libro mayor de inventario
-- =============================================================================
-- Tabla INMUTABLE. Las políticas RLS no conceden UPDATE ni DELETE a nadie,
-- ni siquiera a super_admin. Un error se corrige con un movimiento de ajuste,
-- nunca editando el histórico.
--
-- No existe ninguna ruta en el sistema que modifique product_variants.stock_quantity
-- sin insertar aquí: ambas operaciones ocurren dentro de la misma función
-- PostgreSQL y de la misma transacción (ver 0014_functions.sql).
-- =============================================================================

create table inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products (id),
  variant_id        uuid not null references product_variants (id),
  movement_type     movement_type not null,
  quantity          int not null,              -- negativo = salida
  previous_quantity int not null check (previous_quantity >= 0),
  new_quantity      int not null check (new_quantity >= 0),
  reason            text,
  order_id          uuid,                      -- FK añadida en 0007 (orders aún no existe)
  created_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now(),

  -- La aritmética del movimiento tiene que cuadrar. Un asiento que no cuadra
  -- es un asiento corrupto.
  constraint movement_math_checks_out
    check (new_quantity = previous_quantity + quantity),

  constraint movement_quantity_not_zero
    check (quantity <> 0)
);

create index inventory_movements_variant_idx
  on inventory_movements (variant_id, created_at desc);

create index inventory_movements_order_idx
  on inventory_movements (order_id)
  where order_id is not null;

create index inventory_movements_type_idx
  on inventory_movements (movement_type, created_at desc);

comment on table inventory_movements is
  'Libro mayor inmutable de inventario. Sin UPDATE ni DELETE. Guarda cantidad '
  'anterior y nueva, de modo que el stock es siempre auditable y reconstruible.';
