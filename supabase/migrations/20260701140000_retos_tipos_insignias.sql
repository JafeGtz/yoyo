-- =============================================================
-- 20260701140000_retos_tipos_insignias
-- Retos con tipo (visitas / monto / racha / referidos) y avance del progreso
-- según el tipo. Los referidos se completan en la primera visita del invitado
-- y disparan el avance de los retos de referidos del referidor.
-- Insignias: se agrega el tipo de condición 'monto_total'.
-- =============================================================

alter table reto add column tipo text not null default 'visitas'
  check (tipo in ('visitas', 'monto', 'racha', 'referidos'));

-- ------------------------------------------------------------------
-- Insignias: agrega evaluación por monto total gastado.
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
  v_monto      numeric;
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
  select coalesce(sum(monto), 0) into v_monto from visita where cliente_id = p_cliente_id;
  select nivel_embajador::text, cumpleanos into v_nivel, v_cumpleanos from cliente where id = p_cliente_id;
  v_hora := extract(hour from p_fecha)::int;
  v_cumple_dia := v_cumpleanos is not null and to_char(p_fecha, 'MM-DD') = to_char(v_cumpleanos, 'MM-DD');

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
      when 'visitas_totales'       then v_visitas   >= coalesce(v_val::int, 0)
      when 'monto_total'           then v_monto     >= coalesce(v_val::numeric, 0)
      when 'negocios_distintos'    then v_distintos >= coalesce(v_val::int, 0)
      when 'referidos_completados' then v_referidos >= coalesce(v_val::int, 0)
      when 'hora_antes'            then v_hora < coalesce(v_val::int, 0)
      when 'hora_despues'          then v_hora >= coalesce(v_val::int, 99)
      when 'visita_cumpleanos'     then v_cumple_dia
      when 'nivel_embajador'       then v_nivel = v_val
      when 'racha_dias'            then v_racha >= coalesce(v_val::int, 0)
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
-- Motor de visita: avanza retos según su tipo + completa referidos del invitado.
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
  v_racha  integer;
  v_old    integer;
  v_prog   integer;
  v_estado text;
  r        record;
begin
  update cliente set puntos_globales = puntos_globales + 10
  where id = NEW.cliente_id returning puntos_globales into v_puntos;

  v_nivel := (case
    when v_puntos >= 5000 then 'diamante'
    when v_puntos >= 1500 then 'platino'
    when v_puntos >= 500  then 'oro'
    when v_puntos >= 100  then 'plata'
    else 'bronce'
  end)::nivel_embajador;
  update cliente set nivel_embajador = v_nivel where id = NEW.cliente_id;

  -- La primera visita del invitado completa su referido (dispara su trigger).
  update referido set estado = 'completado'
  where referido_cliente_id = NEW.cliente_id and estado = 'pendiente';

  -- Racha de días consecutivos (para retos tipo 'racha').
  with d as (select distinct date(creado_en) dd from visita where cliente_id = NEW.cliente_id),
       g as (select dd, (dd - (row_number() over (order by dd))::int) as grp from d)
  select count(*) into v_racha from g where grp = (select grp from g order by dd desc limit 1);

  for r in
    select id, greatest(meta, 1) as meta, beneficio_id, tipo from reto
    where negocio_id = NEW.negocio_id and activo and tipo in ('visitas', 'monto', 'racha')
      and (vence_en is null or vence_en >= NEW.creado_en)
      and (inicia_en is null or inicia_en <= NEW.creado_en)
  loop
    select progreso into v_old from reto_progreso where cliente_id = NEW.cliente_id and reto_id = r.id;
    v_old := coalesce(v_old, 0);
    v_prog := case r.tipo
      when 'monto' then v_old + round(coalesce(NEW.monto, 0))::int
      when 'racha' then v_racha
      else v_old + 1
    end;
    v_estado := case when v_prog >= r.meta then 'completado' else 'en_progreso' end;

    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (NEW.cliente_id, r.id, v_prog, r.meta, v_estado::reto_progreso_estado)
    on conflict (cliente_id, reto_id) do update
      set progreso = v_prog, estado = v_estado::reto_progreso_estado, actualizado_en = now();

    if v_old < r.meta and v_prog >= r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(NEW.cliente_id, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;

  perform private.evaluar_insignias(NEW.cliente_id, NEW.creado_en);
  return NEW;
end;
$$;

-- ------------------------------------------------------------------
-- Al completarse un referido: avanza los retos de referidos del referidor
-- (progreso = total de referidos completados) + reevalúa sus insignias.
-- ------------------------------------------------------------------
create or replace function private.procesar_referido_completado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_old   integer;
  v_prog  integer;
  v_estado text;
  r       record;
begin
  if NEW.estado <> 'completado' then return NEW; end if;
  if TG_OP = 'UPDATE' and OLD.estado = 'completado' then return NEW; end if;

  select count(*) into v_total from referido
  where referidor_cliente_id = NEW.referidor_cliente_id and estado = 'completado';

  for r in
    select rt.id, greatest(rt.meta, 1) as meta, rt.beneficio_id
    from reto rt
    join cliente_negocio cn on cn.negocio_id = rt.negocio_id and cn.cliente_id = NEW.referidor_cliente_id
    where rt.tipo = 'referidos' and rt.activo
  loop
    select progreso into v_old from reto_progreso where cliente_id = NEW.referidor_cliente_id and reto_id = r.id;
    v_old := coalesce(v_old, 0);
    v_prog := v_total;
    v_estado := case when v_prog >= r.meta then 'completado' else 'en_progreso' end;

    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (NEW.referidor_cliente_id, r.id, v_prog, r.meta, v_estado::reto_progreso_estado)
    on conflict (cliente_id, reto_id) do update
      set progreso = v_prog, estado = v_estado::reto_progreso_estado, actualizado_en = now();

    if v_old < r.meta and v_prog >= r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(NEW.referidor_cliente_id, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;

  perform private.evaluar_insignias(NEW.referidor_cliente_id, now());
  return NEW;
end;
$$;

drop trigger if exists tg_referido_completado on referido;
create trigger tg_referido_completado
  after insert or update of estado on referido
  for each row execute function private.procesar_referido_completado();
