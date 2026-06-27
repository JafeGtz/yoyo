-- =============================================================
-- 20260626150000_gamificacion_motor
-- Motor de gamificación: otorga insignias, niveles de membresía, puntos
-- globales / nivel Embajador, progreso de retos; + RPCs de ranking y sorteo.
-- Se dispara automáticamente al registrar visitas (triggers).
-- =============================================================

-- Meta de los retos basados en visitas (ej. "visita 5 veces").
alter table reto add column meta integer not null default 1;

-- ------------------------------------------------------------------
-- Evaluar y otorgar insignias al cliente según las condiciones de logro.
-- ------------------------------------------------------------------
create or replace function private.evaluar_insignias(p_cliente_id uuid, p_fecha timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_visitas    integer;
  v_distintos  integer;
  v_referidos  integer;
  v_nivel      text;
  v_cumpleanos date;
  v_hora       integer;
  v_cumple_dia boolean;
  v_racha      integer;
  v_ok         boolean;
  v_val        text;
begin
  select count(*) into v_visitas from visita where cliente_id = p_cliente_id;
  select count(distinct negocio_id) into v_distintos from visita where cliente_id = p_cliente_id;
  select count(*) into v_referidos from referido where referidor_cliente_id = p_cliente_id and estado = 'completado';
  select nivel_embajador::text, cumpleanos into v_nivel, v_cumpleanos from cliente where id = p_cliente_id;
  v_hora := extract(hour from p_fecha)::int;
  v_cumple_dia := v_cumpleanos is not null and to_char(p_fecha, 'MM-DD') = to_char(v_cumpleanos, 'MM-DD');

  -- Racha de días consecutivos terminando en la visita más reciente.
  with d as (select distinct date(creado_en) dd from visita where cliente_id = p_cliente_id),
       g as (select dd, (dd - (row_number() over (order by dd))::int) as grp from d)
  select count(*) into v_racha from g
  where grp = (select grp from g order by dd desc limit 1);

  for r in
    select id, condicion from logro
    where activo and (
      ambito = 'global'
      or negocio_id in (select distinct negocio_id from visita where cliente_id = p_cliente_id)
    )
  loop
    v_val := r.condicion->>'valor';
    v_ok := case r.condicion->>'tipo'
      when 'visitas_totales'      then v_visitas  >= coalesce(v_val::int, 0)
      when 'negocios_distintos'   then v_distintos >= coalesce(v_val::int, 0)
      when 'referidos_completados' then v_referidos >= coalesce(v_val::int, 0)
      when 'hora_antes'           then v_hora < coalesce(v_val::int, 0)
      when 'hora_despues'         then v_hora >= coalesce(v_val::int, 99)
      when 'visita_cumpleanos'    then v_cumple_dia
      when 'nivel_embajador'      then v_nivel = v_val
      when 'racha_dias'           then v_racha >= coalesce(v_val::int, 0)
      else false
    end;
    if v_ok then
      insert into insignia_obtenida (cliente_id, logro_id)
      values (p_cliente_id, r.id)
      on conflict (cliente_id, logro_id) do nothing;
    end if;
  end loop;
end;
$$;

-- ------------------------------------------------------------------
-- Al registrar una visita: puntos globales + nivel Embajador + retos +
-- insignias. (El nivel de membresía del negocio lo maneja otro trigger.)
-- ------------------------------------------------------------------
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
  -- Puntos globales (+10 por visita) y nivel Embajador.
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

  -- Avanzar retos activos del negocio (1 punto de progreso por visita).
  for r in
    select id, greatest(meta, 1) as meta from reto
    where negocio_id = NEW.negocio_id and activo
      and (vence_en is null or vence_en >= NEW.creado_en)
      and (inicia_en is null or inicia_en <= NEW.creado_en)
  loop
    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (NEW.cliente_id, r.id, 1, r.meta, case when 1 >= r.meta then 'completado' else 'en_progreso' end)
    on conflict (cliente_id, reto_id) do update
      set progreso = reto_progreso.progreso + 1,
          estado = case when reto_progreso.progreso + 1 >= reto_progreso.meta then 'completado' else 'en_progreso' end,
          actualizado_en = now();
  end loop;

  -- Insignias.
  perform private.evaluar_insignias(NEW.cliente_id, NEW.creado_en);

  return NEW;
end;
$$;

create trigger tg_visita_gamificacion
  after insert on visita
  for each row execute function private.procesar_gamificacion_visita();

-- ------------------------------------------------------------------
-- Nivel de membresía del negocio según las visitas acumuladas.
-- ------------------------------------------------------------------
create or replace function private.actualizar_nivel_membresia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.nivel_membresia_id := (
    select id from nivel_membresia
    where negocio_id = new.negocio_id and visitas_minimas <= new.visitas_totales
    order by visitas_minimas desc limit 1
  );
  return new;
end;
$$;

create trigger tg_cn_nivel
  before insert or update of visitas_totales on cliente_negocio
  for each row execute function private.actualizar_nivel_membresia();

-- ------------------------------------------------------------------
-- RPC: ranking del negocio (leaderboard / cliente del mes).
-- ------------------------------------------------------------------
create or replace function ranking_negocio(p_negocio_id uuid, p_desde timestamptz)
returns table(nombre text, visitas bigint)
language sql
security definer
set search_path = public
as $$
  select c.nombre, count(*)::bigint
  from visita v join cliente c on c.id = v.cliente_id
  where v.negocio_id = p_negocio_id and v.creado_en >= p_desde
  group by c.nombre
  order by count(*) desc
  limit 10;
$$;
grant execute on function ranking_negocio(uuid, timestamptz) to authenticated;

-- ------------------------------------------------------------------
-- RPC: sortear una rifa (elige ganador al azar entre los clientes).
-- ------------------------------------------------------------------
create or replace function sortear_rifa(p_rifa_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_negocio uuid; v_cli uuid; v_nombre text;
begin
  select negocio_id into v_negocio from rifa where id = p_rifa_id;
  if v_negocio is null then raise exception 'rifa_inexistente'; end if;
  if not private.es_miembro_negocio(v_negocio) then raise exception 'no_autorizado'; end if;

  select cn.cliente_id, c.nombre into v_cli, v_nombre
  from cliente_negocio cn join cliente c on c.id = cn.cliente_id
  where cn.negocio_id = v_negocio and not cn.bloqueado
  order by random() limit 1;
  if v_cli is null then raise exception 'sin_participantes'; end if;

  update rifa set ganador_cliente_id = v_cli, estado = 'sorteada' where id = p_rifa_id;
  return v_nombre;
end;
$$;
grant execute on function sortear_rifa(uuid) to authenticated;
