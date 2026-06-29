-- =============================================================
-- 20260628100000_ranking_cliente_id
-- ranking_negocio ahora devuelve también cliente_id para que la app
-- pueda resaltar la posición del usuario. (La web ignora el campo extra.)
-- =============================================================

drop function if exists ranking_negocio(uuid, timestamptz);

create or replace function ranking_negocio(p_negocio_id uuid, p_desde timestamptz)
returns table(cliente_id uuid, nombre text, visitas bigint)
language sql
security definer
set search_path = public
as $$
  select v.cliente_id, c.nombre, count(*)::bigint
  from visita v join cliente c on c.id = v.cliente_id
  where v.negocio_id = p_negocio_id and v.creado_en >= p_desde
  group by v.cliente_id, c.nombre
  order by count(*) desc
  limit 10;
$$;
grant execute on function ranking_negocio(uuid, timestamptz) to authenticated;
