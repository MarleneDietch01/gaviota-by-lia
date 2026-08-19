-- =============================================================================
-- 0012_content.sql — Contenido editable, FAQ y ajustes del sitio
-- =============================================================================
-- Ningún contenido comercial importante vive dentro de un componente.
-- La propietaria edita el home, las páginas de marca y las políticas desde el
-- panel, sin desplegar y sin tocar código.
-- =============================================================================

create table content_sections (
  id           uuid primary key default gen_random_uuid(),
  section_key  text not null unique,
  title        text,
  subtitle     text,
  body         text,
  image_path   text,
  image_alt    text,
  button_label text,
  button_url   text,
  settings     jsonb not null default '{}'::jsonb,
  status       entity_status not null default 'draft',
  sort_order   int not null default 0,
  updated_by   uuid references profiles (id) on delete set null,
  updated_at   timestamptz not null default now(),

  constraint section_key_format check (section_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'),

  -- Si hay botón, necesita etiqueta y destino. Evita el botón que no lleva a
  -- ninguna parte y el enlace con "#", ambos prohibidos por el brief.
  constraint button_is_complete
    check (
      (button_label is null and button_url is null)
      or (button_label is not null and button_url is not null
          and button_url <> '#' and length(trim(button_url)) > 0)
    )
);

create index content_sections_status_idx on content_sections (status, sort_order);

comment on table content_sections is
  'Contenido editable del sitio. status <> active => la sección NO se renderiza '
  'en producción. Así se cumple sin esfuerzo la regla de no publicar bloques '
  'vacíos ni contenido de demostración.';

-- -----------------------------------------------------------------------------
-- faqs
-- -----------------------------------------------------------------------------
-- El sitio actual NO tiene FAQ, pese a tener dos enlaces de menú llamados
-- "Preguntas" que apuntan a otras páginas. Se crea vacía: las preguntas reales
-- las aporta la propietaria (CONTENT_TODO.md C8).
-- -----------------------------------------------------------------------------
create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (length(trim(question)) > 0),
  answer     text not null check (length(trim(answer)) > 0),
  category   text,
  status     entity_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_status_idx on faqs (status, sort_order);

-- -----------------------------------------------------------------------------
-- site_settings
-- -----------------------------------------------------------------------------
create table site_settings (
  id            uuid primary key default gen_random_uuid(),
  setting_key   text not null unique,
  setting_value jsonb not null,
  description   text,
  updated_by    uuid references profiles (id) on delete set null,
  updated_at    timestamptz not null default now(),

  constraint setting_key_format check (setting_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$')
);

comment on table site_settings is
  'Ajustes del negocio: nombre comercial, contacto, redes, SEO, interruptores '
  'de sección. Sin acceso para clientes.';
