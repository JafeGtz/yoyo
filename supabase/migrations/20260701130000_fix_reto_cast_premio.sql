-- Corrige procesar_gamificacion_visita: reintroduce el cast a reto_progreso_estado
-- (que la migración de premios había omitido) manteniendo la entrega del premio del reto.
create or replace function private.procesar_gamificacion_visita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_puntos integer;
  v_nivel  nivel_embajador;
  v_prog   integer;
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
    select id, greatest(meta, 1) as meta, beneficio_id from reto
    where negocio_id = NEW.negocio_id and activo
      and (vence_en is null or vence_en >= NEW.creado_en)
      and (inicia_en is null or inicia_en <= NEW.creado_en)
  loop
    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (NEW.cliente_id, r.id, 1, r.meta,
            (case when 1 >= r.meta then 'completado' else 'en_progreso' end)::reto_progreso_estado)
    on conflict (cliente_id, reto_id) do update
      set progreso = reto_progreso.progreso + 1,
          estado = (case when reto_progreso.progreso + 1 >= reto_progreso.meta
                         then 'completado' else 'en_progreso' end)::reto_progreso_estado,
          actualizado_en = now()
    returning progreso into v_prog;

    if v_prog = r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(NEW.cliente_id, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;

  perform private.evaluar_insignias(NEW.cliente_id, NEW.creado_en);
  return NEW;
end;
$$;
