-- =============================================================
-- 20260626120000_beneficio_nivel_membresia
-- Beneficios exclusivos por nivel de membresía (requerimientos 5.5).
-- nivel_membresia_id NULL = beneficio general (cualquiera lo desbloquea);
-- con valor = exclusivo de ese nivel.
-- =============================================================

alter table beneficio
  add column nivel_membresia_id uuid references nivel_membresia(id) on delete set null;

create index idx_beneficio_nivel on beneficio (nivel_membresia_id);
