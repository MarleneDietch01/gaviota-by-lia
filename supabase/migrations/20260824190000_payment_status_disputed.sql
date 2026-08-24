-- =============================================================================
-- 20260824190000_payment_status_disputed.sql
-- =============================================================================
-- Agrega 'disputed' a payment_status. Deliberadamente NO se toca order_status:
-- una orden puede estar 'shipped' y su pago en disputa a la vez, y forzar un
-- solo campo obligaría a elegir cuál verdad se pierde. La disputa es estado
-- del PAGO (tabla `payments`), nunca se escribe en `orders.order_status` ni en
-- `orders.payment_status` — solo en `payments.status`, que es donde vive.
-- =============================================================================

alter type payment_status add value if not exists 'disputed';
