-- =============================================================
-- 20260626150100_fix_reto_estado_cast
-- Corrige procesar_gamificacion_visita: el estado de reto_progreso es un
-- enum y el CASE devolvía text. Se castea a reto_progreso_estado.
-- =============================================================

create or replace function private.procesar_gamificacion_visita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_puntos integer;
  v_nivel  nivel_embajador;
  r        record;
begin
  update cliente set puntos_globales = puntos_globales + 10
  where id = NEW.cliente_id
  returning puntos_globales into v_puntos;

  v_nivel := (case
    when v_puntos >= 5000 then 'diamante'
    when v_puntos >= 1500 then 'platino'
    when v_puntos >= 500  then 'oro'
    when v_puntos >= 100  then 'plata'
    else 'bronce'
  end)::nivel_embajador;
  update cliente set nivel_embajador = v_nivel where id = NEW.cliente_id;

  for r in
    select id, greatest(meta, 1) as meta from reto
    where negocio_id = NEW.negocio_id and activo
      and (vence_en is null or vence_en >= NEW.creado_en)
      and (inicia_en is null or inicia_en <= NEW.creado_en)
  loop
    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (
      NEW.cliente_id, r.id, 1, r.meta,
      (case when 1 >= r.meta then 'completado' else 'en_progreso' end)::reto_progreso_estado
    )
    on conflict (cliente_id, reto_id) do update
      set progreso = reto_progreso.progreso + 1,
          estado = (case when reto_progreso.progreso + 1 >= reto_progreso.meta
                         then 'completado' else 'en_progreso' end)::reto_progreso_estado,
          actualizado_en = now();
  end loop;

  perform private.evaluar_insignias(NEW.cliente_id, NEW.creado_en);

  return NEW;
end;
$$;
