-- =============================================================
-- 20260629100000_seguridad_visita
-- Nivel de seguridad de visita por negocio:
--   'abierto' → el cliente escanea y ya (QR no expuesto / bajo riesgo)
--   'codigo'  → escanea + código de un solo uso que da el cajero (QR a la vista)
-- =============================================================

create type seguridad_visita as enum ('abierto', 'codigo');
alter table negocio add column seguridad_visita seguridad_visita not null default 'abierto';

-- Códigos de un solo uso (o N usos para grupos), de vida corta.
create table codigo_visita (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocio(id) on delete cascade,
  codigo      text not null,
  usos_max    integer not null default 1,
  usos        integer not null default 0,
  expira_en   timestamptz not null,
  creado_por  uuid references usuario_negocio(id) on delete set null,
  creado_en   timestamptz not null default now()
);
create index idx_codigo_visita_lookup on codigo_visita (negocio_id, codigo, expira_en);

alter table codigo_visita enable row level security;
-- Solo el personal del negocio (y admin) gestiona los códigos. El cliente NO
-- los lee directamente: la validación ocurre en la Edge Function registrar-visita.
create policy cv_rw on codigo_visita for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());
