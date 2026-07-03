-- =============================================================
-- 20260701110000_niveles_monto_caduca
-- Arregla 3 huecos de membresías:
--   1. El nivel solo contaba visitas -> ahora el negocio elige criterio
--      (por visitas o por monto), y cada nivel tiene monto_minimo.
--   2. caduca_anual no hacía nada -> los niveles marcados caduca_anual se
--      evalúan sobre los últimos 12 meses (visitas/monto), no de por vida.
--   3. Editar/agregar niveles no re-clasificaba a los clientes existentes ->
--      RPC recalcular_niveles() que re-evalúa a todos los clientes del negocio.
-- =============================================================

alter table negocio
  add column nivel_criterio text not null default 'visitas'
  check (nivel_criterio in ('visitas', 'monto'));

alter table nivel_membresia
  add column monto_minimo numeric not null default 0;

-- ------------------------------------------------------------------
-- Recalcula el nivel de un cliente según el criterio del negocio.
-- Para niveles con caduca_anual usa la ventana de los últimos 12 meses.
-- ------------------------------------------------------------------
create or replace function private.actualizar_nivel_membresia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_criterio     text;
  v_year_visitas integer;
  v_year_monto   numeric;
begin
  select coalesce(nivel_criterio, 'visitas') into v_criterio
  from negocio where id = new.negocio_id;

  -- Métricas de los últimos 12 meses (solo relevantes para niveles caduca_anual).
  select count(*), coalesce(sum(monto), 0)
    into v_year_visitas, v_year_monto
  from visita
  where cliente_id = new.cliente_id and negocio_id = new.negocio_id
    and creado_en >= now() - interval '1 year';

  new.nivel_membresia_id := (
    select n.id
    from nivel_membresia n
    where n.negocio_id = new.negocio_id
      and (
        case when v_criterio = 'monto'
          then (case when n.caduca_anual then v_year_monto else new.monto_acumulado end) >= n.monto_minimo
          else (case when n.caduca_anual then v_year_visitas else new.visitas_totales end) >= n.visitas_minimas
        end
      )
    order by (case when v_criterio = 'monto' then n.monto_minimo else n.visitas_minimas end) desc
    limit 1
  );
  return new;
end;
$$;

-- Ahora también reacciona a cambios de monto (antes solo a visitas).
drop trigger if exists tg_cn_nivel on cliente_negocio;
create trigger tg_cn_nivel
  before insert or update of visitas_totales, monto_acumulado on cliente_negocio
  for each row execute function private.actualizar_nivel_membresia();

-- ------------------------------------------------------------------
-- RPC: re-clasifica a TODOS los clientes de un negocio (Hueco 3).
-- Se llama desde el SaaS al crear/editar/eliminar un nivel o cambiar el criterio.
-- El UPDATE no-op dispara el trigger anterior por cada cliente.
-- ------------------------------------------------------------------
create or replace function recalcular_niveles(p_negocio_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from usuario_negocio un
    where un.negocio_id = p_negocio_id and un.auth_user_id = auth.uid() and un.activo
  ) then
    raise exception 'no_autorizado';
  end if;

  update cliente_negocio
  set visitas_totales = visitas_totales
  where negocio_id = p_negocio_id;
end;
$$;
grant execute on function recalcular_niveles(uuid) to authenticated;
