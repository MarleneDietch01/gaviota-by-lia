-- =============================================================================
-- 0002_enums.sql — Tipos enumerados
-- =============================================================================
-- Se usan enum del motor y no columnas de texto con convención: un `text`
-- acepta 'Paid', 'paid ' o 'payed' y corrompe los datos en silencio.
-- El enum lo rechaza en el momento de la escritura.
-- =============================================================================

-- Roles. Tres, deliberadamente: el MVP no necesita más y cada rol extra
-- multiplica las combinaciones de política RLS que hay que probar.
create type user_role as enum ('customer', 'admin', 'super_admin');

create type user_status as enum ('active', 'suspended');

-- Ciclo de vida de las entidades de catálogo y contenido.
-- 'archived' sustituye al borrado: un producto vinculado a un pedido histórico
-- nunca se elimina físicamente.
create type entity_status as enum ('draft', 'active', 'archived');

create type order_status as enum (
  'pending_payment',
  'paid',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded'
);

create type fulfillment_status as enum (
  'unfulfilled',
  'preparing',
  'ready',
  'shipped',
  'delivered',
  'returned'
);

create type payment_status as enum (
  'pending',
  'authorized',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);

-- Tipos de movimiento del libro mayor de inventario.
-- 'reservation' y 'reservation_release' sostienen el flujo de checkout:
-- se reserva al iniciar el pago y se libera si el pago falla o expira.
create type movement_type as enum (
  'initial',
  'purchase',
  'adjustment',
  'sale',
  'cancellation',
  'refund',
  'return',
  'reservation',
  'reservation_release'
);

create type discount_type as enum ('percentage', 'fixed');

create type cart_status as enum ('active', 'converted', 'abandoned', 'expired');

create type address_type as enum ('shipping', 'billing');

-- 'pending' es el valor por defecto: ninguna reseña se publica sin moderación.
create type review_status as enum ('pending', 'approved', 'rejected');
