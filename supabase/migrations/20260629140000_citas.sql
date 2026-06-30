-- =============================================================
-- 20260629140000_citas
-- Agenda de citas configurable por negocio:
--   'desactivado' → sin citas
--   'solicitud'   → el cliente manda una solicitud (estado pendiente); el dueño aprueba
--   'agenda'      → el cliente ve huecos libres y reserva (auto-confirmada)
-- =============================================================

create type citas_modo as enum ('desactivado', 'solicitud', 'agenda');
alter table negocio add column citas_modo citas_modo not null default 'desactivado';
-- Config de disponibilidad (solo modo agenda):
--   { dias:[1..5], hora_inicio:"09:00", hora_fin:"18:00", duracion_min:30,
--     descanso_inicio:"14:00", descanso_fin:"15:00", timezone:"America/Mexico_City" }
alter table negocio add column agenda_config jsonb not null default '{}'::jsonb;

-- Evita doble reserva del mismo hueco (solo citas confirmadas, modo agenda).
create unique index uq_cita_slot_confirmada on cita (negocio_id, inicia_en)
  where estado = 'confirmada';

-- ------------------------------------------------------------------
-- RPC: huecos disponibles de un negocio en una fecha (modo agenda).
-- Calcula desde agenda_config y descuenta las citas confirmadas.
-- security definer: el cliente no puede ver las citas de otros por RLS.
-- ------------------------------------------------------------------
create or replace function slots_disponibles(p_negocio_id uuid, p_fecha date)
returns timestamptz[]
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg       jsonb;
  dias      int[];
  h_ini     time;
  h_fin     time;
  dur       int;
  desc_ini  time;
  desc_fin  time;
  tz        text;
  slot      timestamptz;
  fin_dia   timestamptz;
  res       timestamptz[] := '{}';
begin
  select agenda_config into cfg from negocio where id = p_negocio_id;
  if cfg is null or cfg = '{}'::jsonb then return res; end if;

  dias := array(select jsonb_array_elements_text(cfg->'dias')::int);
  if array_length(dias, 1) is null or not (extract(dow from p_fecha)::int = any(dias)) then
    return res;
  end if;

  h_ini    := (cfg->>'hora_inicio')::time;
  h_fin    := (cfg->>'hora_fin')::time;
  dur      := coalesce((cfg->>'duracion_min')::int, 30);
  desc_ini := nullif(cfg->>'descanso_inicio', '')::time;
  desc_fin := nullif(cfg->>'descanso_fin', '')::time;
  tz       := coalesce(nullif(cfg->>'timezone', ''), 'America/Mexico_City');

  slot    := (p_fecha + h_ini) at time zone tz;
  fin_dia := (p_fecha + h_fin) at time zone tz;

  while slot < fin_dia loop
    if (desc_ini is null or not ((slot at time zone tz)::time >= desc_ini and (slot at time zone tz)::time < desc_fin))
       and slot > now()
       and not exists (
         select 1 from cita
         where negocio_id = p_negocio_id and estado = 'confirmada' and inicia_en = slot
       )
    then
      res := res || slot;
    end if;
    slot := slot + make_interval(mins => dur);
  end loop;

  return res;
end;
$$;
grant execute on function slots_disponibles(uuid, date) to authenticated;

-- ------------------------------------------------------------------
-- RPC: reservar un hueco (modo agenda). Atómico contra doble reserva.
-- ------------------------------------------------------------------
create or replace function agendar_cita(
  p_negocio_id uuid,
  p_inicia_en timestamptz,
  p_servicio text,
  p_duracion int
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli uuid;
  v_id  uuid;
begin
  v_cli := private.cliente_actual();
  if v_cli is null then raise exception 'no_cliente'; end if;

  begin
    insert into cita (cliente_id, negocio_id, servicio, inicia_en, duracion_min, estado)
    values (v_cli, p_negocio_id, p_servicio, p_inicia_en, coalesce(p_duracion, 30), 'confirmada')
    returning id into v_id;
  exception when unique_violation then
    raise exception 'slot_ocupado';
  end;

  return v_id;
end;
$$;
grant execute on function agendar_cita(uuid, timestamptz, text, int) to authenticated;
