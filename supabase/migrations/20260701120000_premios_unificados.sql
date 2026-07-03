-- =============================================================
-- 20260701120000_premios_unificados
-- Cierra los huecos de gamificación con un modelo unificado:
--   Ganar (reto / rifa / ruleta / rasca) = otorgar_beneficio():
--     desbloquea un beneficio canjeable (aparece en "Tus beneficios")
--     + crea una notificación (para el pop-up de la app).
-- Además:
--   - premio_juego/rifa/reto enlazan a un beneficio (el premio real).
--   - juego_config: nivel requerido (todos o cierto nivel) + giros por día.
--   - juego_giro: registra cada jugada (persiste el premio y limita giros).
--   - rifa aplica su criterio (min_visitas); reto entrega su premio al completar.
-- =============================================================

alter table premio_juego add column beneficio_id uuid references beneficio(id) on delete set null;
alter table rifa         add column beneficio_id uuid references beneficio(id) on delete set null;
alter table reto         add column beneficio_id uuid references beneficio(id) on delete set null;

-- Config del juego por negocio (nivel requerido + límite de giros).
create table juego_config (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocio(id) on delete cascade,
  juego              juego_tipo not null,
  nivel_membresia_id uuid references nivel_membresia(id) on delete set null, -- null = todos
  giros_max_dia      integer not null default 1,
  creado_en          timestamptz not null default now(),
  unique (negocio_id, juego)
);
alter table juego_config enable row level security;
create policy jc_select on juego_config for select to authenticated using (true);
create policy jc_write on juego_config for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- Registro de cada jugada (persiste el premio y sirve para limitar giros).
create table juego_giro (
  id                        uuid primary key default gen_random_uuid(),
  negocio_id                uuid not null references negocio(id) on delete cascade,
  cliente_id                uuid not null references cliente(id) on delete cascade,
  juego                     juego_tipo not null,
  premio_juego_id           uuid references premio_juego(id) on delete set null,
  premio_nombre             text,
  beneficio_desbloqueado_id uuid references beneficio_desbloqueado(id) on delete set null,
  creado_en                 timestamptz not null default now()
);
create index idx_juego_giro on juego_giro (negocio_id, cliente_id, juego, creado_en);
alter table juego_giro enable row level security;
create policy jg_select on juego_giro for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- otorgar_beneficio: desbloquea un beneficio para un cliente (respeta stock,
-- reserva al ganar) y crea la notificación. Devuelve el id del desbloqueo,
-- o null si no hay stock o el beneficio no existe. Uso interno (no expuesto a
-- clientes): lo llaman los triggers y la edge function (service role).
-- ------------------------------------------------------------------
create or replace function otorgar_beneficio(
  p_cliente_id uuid,
  p_beneficio_id uuid,
  p_titulo text default 'Ganaste un premio'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_neg uuid; v_vig int; v_stock int; v_res int; v_canj int; v_bd uuid; v_nombre text;
begin
  if p_beneficio_id is null then return null; end if;
  select negocio_id, vigencia_dias, stock_total, nombre
    into v_neg, v_vig, v_stock, v_nombre
  from beneficio where id = p_beneficio_id;
  if v_neg is null then return null; end if;

  if v_stock is not null then
    select count(*) into v_res from beneficio_desbloqueado
      where beneficio_id = p_beneficio_id and estado = 'disponible' and vence_en > now();
    select count(*) into v_canj from beneficio_desbloqueado
      where beneficio_id = p_beneficio_id and estado = 'canjeado';
    if v_stock - v_res - v_canj <= 0 then return null; end if; -- agotado
  end if;

  insert into beneficio_desbloqueado (cliente_id, beneficio_id, negocio_id, estado, vence_en)
  values (p_cliente_id, p_beneficio_id, v_neg, 'disponible', now() + make_interval(days => coalesce(v_vig, 30)))
  returning id into v_bd;

  insert into notificacion (cliente_id, tipo, titulo, cuerpo, data)
  values (p_cliente_id, 'premio', p_titulo,
          'Ganaste: ' || v_nombre || '. Ya está en tus beneficios.',
          jsonb_build_object('beneficio_desbloqueado_id', v_bd, 'beneficio_id', p_beneficio_id));

  return v_bd;
end;
$$;

-- ------------------------------------------------------------------
-- Rifa: aplica el criterio (min_visitas) y entrega el premio al ganador.
-- ------------------------------------------------------------------
create or replace function sortear_rifa(p_rifa_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_negocio uuid; v_cli uuid; v_nombre text; v_min int; v_ben uuid;
begin
  select negocio_id, coalesce((criterio->>'min_visitas')::int, 0), beneficio_id
    into v_negocio, v_min, v_ben
  from rifa where id = p_rifa_id;
  if v_negocio is null then raise exception 'rifa_inexistente'; end if;
  if not private.es_miembro_negocio(v_negocio) then raise exception 'no_autorizado'; end if;

  select cn.cliente_id, c.nombre into v_cli, v_nombre
  from cliente_negocio cn join cliente c on c.id = cn.cliente_id
  where cn.negocio_id = v_negocio and not cn.bloqueado
    and cn.visitas_totales >= v_min
  order by random() limit 1;
  if v_cli is null then raise exception 'sin_participantes'; end if;

  update rifa set ganador_cliente_id = v_cli, estado = 'sorteada' where id = p_rifa_id;
  perform otorgar_beneficio(v_cli, v_ben, 'Ganaste la rifa');
  return v_nombre;
end;
$$;

-- ------------------------------------------------------------------
-- Motor de visita: al COMPLETAR un reto (progreso alcanza la meta) entrega
-- su beneficio una sola vez.
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
    values (NEW.cliente_id, r.id, 1, r.meta, case when 1 >= r.meta then 'completado' else 'en_progreso' end)
    on conflict (cliente_id, reto_id) do update
      set progreso = reto_progreso.progreso + 1,
          estado = case when reto_progreso.progreso + 1 >= reto_progreso.meta then 'completado' else 'en_progreso' end,
          actualizado_en = now()
    returning progreso into v_prog;

    -- Justo al alcanzar la meta (una sola vez) entrega el premio del reto.
    if v_prog = r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(NEW.cliente_id, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;

  perform private.evaluar_insignias(NEW.cliente_id, NEW.creado_en);
  return NEW;
end;
$$;
