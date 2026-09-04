-- =============================================================================
-- 20260904120000_order_confirmation_emails.sql
-- =============================================================================
-- Soporte para el recibo de compra (clienta) y la notificación de venta
-- (propietaria). `email_log` ya existía (0013_communications_audit.sql, pensada
-- para exactamente esto) — solo faltaban estas dos columnas en `orders`.
-- =============================================================================

alter table orders
  add column locale text not null default 'en',
  add column confirmation_email_sent_at timestamptz;

alter table orders
  add constraint orders_locale_known check (locale in ('en', 'es'));

comment on column orders.locale is
  'Idioma del checkout, capturado en /api/checkout. '
  'Determina el idioma del recibo por correo — el webhook que dispara el envío '
  'no tiene forma de saberlo por sí mismo.';

comment on column orders.confirmation_email_sent_at is
  'Marca de tiempo del envío del recibo. Sirve de candado de idempotencia: '
  'checkout.session.completed y payment_intent.succeeded pueden llegar los dos '
  'para el mismo pedido, y no debe salir un recibo duplicado. Se reclama con un '
  'UPDATE condicionado a que siga en NULL (ver src/lib/email/order-confirmation.ts) '
  'y se revierte a NULL si el envío falla, para que el reintento del webhook '
  'pueda volver a intentarlo.';
