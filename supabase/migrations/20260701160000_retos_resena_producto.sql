-- =============================================================
-- 20260701160000_retos_resena_producto
-- Retos por reseña y por producto (2ª vuelta).
--   - reseña: trigger cuando el cliente crea una reseña del negocio.
--   - producto: la visita guarda qué producto se consumió (catalogo_item_id),
--     el cliente lo etiqueta tras escanear vía RPC marcar_producto_visita.
-- =============================================================

alter table reto drop constraint if exists reto_tipo_check;
alter table reto add constraint reto_tipo_check
  check (tipo in ('visitas', 'monto', 'racha', 'referidos', 'resena', 'producto'));

alter table reto   add column catalogo_item_id uuid references catalogo_item(id) on delete set null;
alter table visita add column catalogo_item_id uuid references catalogo_item(id) on delete set null;

-- ------------------------------------------------------------------
-- Al crear una reseña: avanza los retos tipo 'resena' del negocio.
-- ------------------------------------------------------------------
create or replace function private.procesar_resena()
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
  r        record;
begin
  select count(*) into v_total from resena
  where cliente_id = NEW.cliente_id and negocio_id = NEW.negocio_id;

  for r in
    select id, greatest(meta, 1) as meta, beneficio_id from reto
    where negocio_id = NEW.negocio_id and tipo = 'resena' and activo
      and (vence_en is null or vence_en >= NEW.creada_en)
      and (inicia_en is null or inicia_en <= NEW.creada_en)
  loop
    select progreso into v_old from reto_progreso where cliente_id = NEW.cliente_id and reto_id = r.id;
    v_old := coalesce(v_old, 0);
    v_prog := v_total;
    v_estado := case when v_prog >= r.meta then 'completado' else 'en_progreso' end;

    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (NEW.cliente_id, r.id, v_prog, r.meta, v_estado::reto_progreso_estado)
    on conflict (cliente_id, reto_id) do update
      set progreso = v_prog, estado = v_estado::reto_progreso_estado, actualizado_en = now();

    if v_old < r.meta and v_prog >= r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(NEW.cliente_id, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;
  return NEW;
end;
$$;

drop trigger if exists tg_resena_reto on resena;
create trigger tg_resena_reto
  after insert on resena
  for each row execute function private.procesar_resena();

-- ------------------------------------------------------------------
-- El cliente etiqueta qué producto consumió en una visita suya.
-- Avanza los retos tipo 'producto' de ese producto.
-- ------------------------------------------------------------------
create or replace function marcar_producto_visita(p_visita_id uuid, p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli uuid; v_neg uuid;
  v_total integer; v_old integer; v_prog integer; v_estado text;
  r record;
begin
  select cliente_id, negocio_id into v_cli, v_neg from visita where id = p_visita_id;
  if v_cli is null or v_cli <> private.cliente_actual() then raise exception 'no_autorizado'; end if;

  update visita set catalogo_item_id = p_item_id where id = p_visita_id;

  for r in
    select id, greatest(meta, 1) as meta, beneficio_id from reto
    where negocio_id = v_neg and tipo = 'producto' and catalogo_item_id = p_item_id and activo
  loop
    select count(*) into v_total from visita
    where cliente_id = v_cli and negocio_id = v_neg and catalogo_item_id = p_item_id;
    select progreso into v_old from reto_progreso where cliente_id = v_cli and reto_id = r.id;
    v_old := coalesce(v_old, 0);
    v_prog := v_total;
    v_estado := case when v_prog >= r.meta then 'completado' else 'en_progreso' end;

    insert into reto_progreso (cliente_id, reto_id, progreso, meta, estado)
    values (v_cli, r.id, v_prog, r.meta, v_estado::reto_progreso_estado)
    on conflict (cliente_id, reto_id) do update
      set progreso = v_prog, estado = v_estado::reto_progreso_estado, actualizado_en = now();

    if v_old < r.meta and v_prog >= r.meta and r.beneficio_id is not null then
      perform otorgar_beneficio(v_cli, r.beneficio_id, 'Completaste un reto');
    end if;
  end loop;
end;
$$;
grant execute on function marcar_producto_visita(uuid, uuid) to authenticated;
