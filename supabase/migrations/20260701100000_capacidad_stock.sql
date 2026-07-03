-- =============================================================
-- 20260701100000_capacidad_stock
-- Control de capacidad v3: stock con reserva al ganar + métricas.
--   - canje.beneficio_id: enlaza el canje a su beneficio (para métricas por beneficio)
--   - canje.costo: congela el costo del día del canje (Hueco 4)
--   - RPC capacidad_resumen: reservados / canjeados / canjes del mes / costo del mes
--     El "físico restante" y "comprometido" salen de aquí (Hueco 2).
--     Los vencidos NO cuentan como reservados => se liberan solos (Hueco 6).
-- =============================================================

alter table canje add column beneficio_id uuid references beneficio(id) on delete set null;
alter table canje add column costo numeric;
create index idx_canje_beneficio on canje (beneficio_id);

-- Backfill de históricos: enlazar y estimar costo desde el beneficio actual.
update canje c
set beneficio_id = d.beneficio_id
from beneficio_desbloqueado d
where d.id = c.beneficio_desbloqueado_id and c.beneficio_id is null;

update canje c
set costo = b.valor_estimado
from beneficio_desbloqueado d
join beneficio b on b.id = d.beneficio_id
where d.id = c.beneficio_desbloqueado_id and c.costo is null;

-- ------------------------------------------------------------------
-- RPC: resumen de capacidad por beneficio del negocio.
-- security definer (agrega sobre datos de todos los clientes), con
-- verificación de que quien llama es miembro del negocio.
-- Ventana del mes calculada en la zona del negocio.
-- ------------------------------------------------------------------
create or replace function capacidad_resumen(p_negocio_id uuid)
returns table (
  beneficio_id uuid,
  reservados   bigint,
  canjeados    bigint,
  canjes_mes   bigint,
  costo_mes    numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mes timestamptz;
begin
  if not exists (
    select 1 from usuario_negocio un
    where un.negocio_id = p_negocio_id and un.auth_user_id = auth.uid() and un.activo
  ) then
    raise exception 'no_autorizado';
  end if;

  v_mes := date_trunc('month', (now() at time zone 'America/Mexico_City')) at time zone 'America/Mexico_City';

  return query
  select
    b.id,
    (select count(*) from beneficio_desbloqueado d
       where d.beneficio_id = b.id and d.estado = 'disponible'
         and d.vence_en is not null and d.vence_en > now())::bigint,
    (select count(*) from beneficio_desbloqueado d
       where d.beneficio_id = b.id and d.estado = 'canjeado')::bigint,
    (select count(*) from canje c where c.beneficio_id = b.id and c.creado_en >= v_mes)::bigint,
    (select coalesce(sum(c.costo), 0) from canje c where c.beneficio_id = b.id and c.creado_en >= v_mes)
  from beneficio b
  where b.negocio_id = p_negocio_id and b.estado <> 'archivado';
end;
$$;
grant execute on function capacidad_resumen(uuid) to authenticated;
