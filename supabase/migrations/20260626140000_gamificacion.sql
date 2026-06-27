-- =============================================================
-- 20260626140000_gamificacion
-- Config de ruleta / rasca y gana (premios + probabilidades) y toggles
-- de gamificación del negocio (requerimientos 5.6). Retos, rifas y logros
-- ya tienen tabla en el esquema base.
-- =============================================================

create type juego_tipo as enum ('ruleta', 'rasca');

create table premio_juego (
  id            uuid primary key default gen_random_uuid(),
  negocio_id    uuid not null references negocio(id) on delete cascade,
  juego         juego_tipo not null,
  nombre        text not null,
  probabilidad  numeric(5,2) not null default 0,   -- porcentaje (0-100)
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);
create index idx_premio_juego_negocio on premio_juego (negocio_id, juego);

alter table premio_juego enable row level security;
create policy pj_select on premio_juego for select to authenticated using (true);
create policy pj_write on premio_juego for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- Toggles de funciones (leaderboard, ruleta, rasca activos, etc.)
alter table negocio add column config jsonb not null default '{}'::jsonb;
