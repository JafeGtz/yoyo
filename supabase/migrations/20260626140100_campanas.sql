-- =============================================================
-- 20260626140100_campanas
-- Campañas y recordatorios a clientes (requerimientos 5.9).
-- El envío crea notificaciones in-app ahora; el push (FCM) se conecta
-- después en la Edge Function enviar-campana.
-- =============================================================

create type campana_estado as enum ('borrador', 'programada', 'enviada');

create table campana (
  id               uuid primary key default gen_random_uuid(),
  negocio_id       uuid not null references negocio(id) on delete cascade,
  titulo           text not null,
  mensaje          text not null,
  segmento         text not null default 'todos',  -- todos | inactivos_7 | inactivos_14 | inactivos_30
  programada_para  timestamptz,
  estado           campana_estado not null default 'borrador',
  enviados         integer not null default 0,
  creado_en        timestamptz not null default now()
);
create index idx_campana_negocio on campana (negocio_id, creado_en);

alter table campana enable row level security;
create policy campana_rw on campana for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());
