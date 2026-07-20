-- =============================================================
-- 20260718100000_baja_nivel_inactividad
-- Baja de nivel de membresía por inactividad. El dueño configura cuántos días.
-- Sin cron: se recalcula cuando el cliente abre la app (RPC revalidar_niveles).
-- =============================================================

-- Config por negocio: días de inactividad para bajar UN nivel (null/0 = nunca).
alter table negocio add column if not exists dias_baja_nivel integer;

-- Marca de la última bajada aplicada (para no bajar más de uno por ventana).
alter table cliente_negocio add column if not exists nivel_baja_en timestamptz;

-- Revalida los niveles del cliente: baja un nivel donde corresponda.
-- Idempotente y barato: solo escribe cuando de verdad baja un nivel.
create or replace function revalidar_niveles(p_cliente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r          record;
  v_ref      timestamptz;
  v_cur_ord  integer;
  v_new_id   uuid;
begin
  -- Solo el propio cliente puede revalidarse.
  if p_cliente_id is null or p_cliente_id <> private.cliente_actual() then
    return;
  end if;

  for r in
    select cn.negocio_id, cn.ultima_visita, cn.nivel_baja_en, cn.nivel_membresia_id, n.dias_baja_nivel
    from cliente_negocio cn
    join negocio n on n.id = cn.negocio_id
    where cn.cliente_id = p_cliente_id
      and n.dias_baja_nivel is not null and n.dias_baja_nivel > 0
      and cn.nivel_membresia_id is not null
  loop
    -- Referencia: la más reciente entre última visita y última bajada.
    v_ref := greatest(r.ultima_visita, r.nivel_baja_en);
    if v_ref is null then continue; end if;

    -- ¿Pasó al menos una ventana completa de inactividad?
    if now() - v_ref < make_interval(days => r.dias_baja_nivel) then continue; end if;

    -- Nivel inmediatamente inferior en el mismo negocio.
    select orden into v_cur_ord from nivel_membresia where id = r.nivel_membresia_id;
    select id into v_new_id
    from nivel_membresia
    where negocio_id = r.negocio_id and orden < v_cur_ord
    order by orden desc
    limit 1;

    -- Si ya está en el nivel más bajo, no hay nada que bajar (no escribe).
    if v_new_id is null then continue; end if;

    -- Baja un nivel y reinicia la ventana.
    update cliente_negocio
      set nivel_membresia_id = v_new_id, nivel_baja_en = now()
    where cliente_id = p_cliente_id and negocio_id = r.negocio_id;
  end loop;
end;
$$;

grant execute on function revalidar_niveles(uuid) to authenticated;
