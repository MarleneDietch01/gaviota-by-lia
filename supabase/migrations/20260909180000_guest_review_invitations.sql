-- =============================================================================
-- Reseñas de invitadas mediante enlace firmado
-- =============================================================================
--
-- `reviews` ya preveía este caso: `user_id` es nulable y `order_id` existe
-- desde 20260803120011. No hace falta ninguna columna nueva.
--
-- Lo que faltaba es la unicidad. La restricción original es
-- `unique (product_id, user_id)`, y en Postgres dos NULL NO son iguales: con
-- `user_id` nulo esa restricción no impide nada, así que un enlace reenviado
-- podría dejar diez reseñas del mismo pedido.
--
-- Este índice parcial cierra eso y, de paso, ES el uso único del enlace: el
-- token firmado no se guarda en ninguna parte (ver
-- src/lib/reviews/invitation-token.ts); lo que impide la segunda reseña es
-- que ya exista la primera.
-- =============================================================================

create unique index if not exists reviews_guest_order_product_idx
  on reviews (product_id, order_id)
  where user_id is null;

comment on index reviews_guest_order_product_idx is
  'Una sola reseña de invitada por pedido y producto. Es el uso único del enlace firmado de invitación.';
