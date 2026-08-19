-- =============================================================================
-- 0016_indexes.sql — Índices adicionales
-- =============================================================================
-- Los índices de clave foránea y de estado se declararon junto a sus tablas.
-- Aquí van los de búsqueda, informes y los índices parciales del panel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Búsqueda de productos
-- -----------------------------------------------------------------------------
-- Diccionario 'spanish', no 'english': el sitio es en español y necesita
-- lematizar correctamente ("hidratante" / "hidratación" / "hidratar").
-- Con 'english' una búsqueda de "hidratación" no encontraría "hidratante".
-- -----------------------------------------------------------------------------
-- 'spanish'::regconfig y no 'spanish' a secas: la sobrecarga que recibe el
-- nombre como texto es STABLE, no IMMUTABLE, y PostgreSQL rechaza una función
-- no inmutable en la expresión de un índice.
create index products_fts_idx on products
  using gin (
    to_tsvector(
      'spanish'::regconfig,
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '')
    )
  );

-- Trigram para coincidencia parcial y tolerancia a erratas ("exfolinte").
create index products_name_trgm_idx on products
  using gin (name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Panel de bajo inventario
-- -----------------------------------------------------------------------------
-- Índice parcial: sirve la consulta de bajo stock sin recorrer toda la tabla.
create index low_stock_idx on product_variants (product_id, stock_quantity)
  where stock_quantity <= low_stock_threshold and status = 'active';

-- -----------------------------------------------------------------------------
-- Informes
-- -----------------------------------------------------------------------------
-- Ventas por periodo: solo pedidos efectivamente cobrados.
create index orders_paid_reporting_idx on orders (created_at desc, grand_total)
  where payment_status = 'paid';

-- Productos más vendidos.
create index order_items_bestsellers_idx on order_items (product_id, quantity);

-- Panel de pedidos pendientes de preparar.
create index orders_pending_fulfillment_idx on orders (created_at)
  where payment_status = 'paid'
    and fulfillment_status in ('unfulfilled', 'preparing');

-- Ficha de cliente: pedidos y total gastado.
create index orders_customer_reporting_idx on orders (user_id, payment_status, grand_total)
  where user_id is not null;
