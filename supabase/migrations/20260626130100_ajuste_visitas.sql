-- =============================================================
-- 20260626130100_ajuste_visitas
-- Edición manual de visitas con registro de auditoría (requerimientos 5.7).
-- =============================================================

create table ajuste_visita (
  id                  uuid primary key default gen_random_uuid(),
  cliente_negocio_id  uuid not null references cliente_negocio(id) on delete cascade,
  negocio_id          uuid not null references negocio(id) on delete cascade,
  usuario_negocio_id  uuid references usuario_negocio(id) on delete set null,
  delta               integer not null,
  motivo              text,
  creado_en           timestamptz not null default now()
);
create index idx_ajuste_visita_cn on ajuste_visita (cliente_negocio_id, creado_en);

alter table ajuste_visita enable row level security;
create policy ajuste_select on ajuste_visita for select to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- Ajuste atómico de visitas: valida membresía, actualiza el total y deja
-- registro de auditoría con el empleado que lo hizo.
create or replace function ajustar_visitas(
  p_cliente_negocio_id uuid,
  p_delta integer,
  p_motivo text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negocio uuid;
  v_total   integer;
  v_un      uuid;
begin
  select negocio_id, visitas_totales into v_negocio, v_total
  from cliente_negocio where id = p_cliente_negocio_id;
  if v_negocio is null then raise exception 'cliente_negocio_inexistente'; end if;
  if not private.es_miembro_negocio(v_negocio) then raise exception 'no_autorizado'; end if;
  if v_total + p_delta < 0 then raise exception 'visitas_negativas'; end if;

  select id into v_un from usuario_negocio
  where auth_user_id = auth.uid() and negocio_id = v_negocio limit 1;

  update cliente_negocio
  set visitas_totales = visitas_totales + p_delta, actualizado_en = now()
  where id = p_cliente_negocio_id;

  insert into ajuste_visita (cliente_negocio_id, negocio_id, usuario_negocio_id, delta, motivo)
  values (p_cliente_negocio_id, v_negocio, v_un, p_delta, p_motivo);

  return v_total + p_delta;
end;
$$;

grant execute on function ajustar_visitas(uuid, integer, text) to authenticated;
