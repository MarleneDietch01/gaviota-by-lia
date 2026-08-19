-- =============================================================================
-- 0011_favorites_reviews.sql — Favoritos y reseñas
-- =============================================================================

create table favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (user_id, product_id)
);

create index favorites_user_idx on favorites (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
-- LA TABLA ARRANCA VACÍA Y ASÍ SE QUEDA HASTA QUE HAYA RESEÑAS REALES.
--
-- El sitio actual no tiene ni una sola reseña. En el lanzamiento no habrá
-- estrellas, ni valoración media, ni AggregateRating en los datos estructurados.
-- Las consultas devolverán count = 0 y los componentes correspondientes no se
-- renderizarán: sin estrellas vacías, sin "Sin reseñas aún", sin bloque hueco.
--
-- Emitir AggregateRating sin reseñas reales es una infracción directa de las
-- directrices de Google y motivo de penalización manual.
--
-- status por defecto 'pending': ninguna reseña se publica sin moderación.
-- verified_purchase solo lo marca el servidor tras comprobar que existe un
-- pedido 'delivered' de ese usuario con ese producto.
-- -----------------------------------------------------------------------------
create table reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products (id) on delete cascade,
  user_id           uuid references profiles (id) on delete set null,
  order_id          uuid references orders (id) on delete set null,
  rating            int not null check (rating between 1 and 5),
  title             text,
  content           text,
  status            review_status not null default 'pending',
  verified_purchase boolean not null default false,
  moderated_by      uuid references profiles (id) on delete set null,
  moderated_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Una reseña por producto y usuario.
  unique (product_id, user_id)
);

create index reviews_product_approved_idx
  on reviews (product_id, created_at desc)
  where status = 'approved';

create index reviews_moderation_idx
  on reviews (status, created_at)
  where status = 'pending';

comment on table reviews is
  'Arranca vacía. Los componentes de valoración no se renderizan con count = 0.';
comment on column reviews.verified_purchase is
  'Solo lo marca el servidor tras comprobar un pedido delivered con ese producto.';

-- -----------------------------------------------------------------------------
-- Vista de agregados de reseñas
-- -----------------------------------------------------------------------------
-- Solo cuenta reseñas aprobadas. Devuelve 0 filas para los productos sin
-- ninguna, que es exactamente lo que hace que la interfaz no pinte estrellas.
-- -----------------------------------------------------------------------------
create view product_review_stats
with (security_invoker = true)
as
select
  product_id,
  count(*)::int                        as review_count,
  round(avg(rating)::numeric, 2)       as average_rating
from reviews
where status = 'approved'
group by product_id;

comment on view product_review_stats is
  'Agregados de reseñas aprobadas. security_invoker: respeta las RLS de quien consulta.';
