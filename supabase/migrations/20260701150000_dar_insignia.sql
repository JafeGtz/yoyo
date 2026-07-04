-- Asignación manual de una insignia del negocio a un cliente (desde el CRM).
-- security definer con verificación de que quien llama es miembro del negocio.
create or replace function dar_insignia(p_cliente_id uuid, p_logro_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_neg uuid; v_nombre text;
begin
  select negocio_id, nombre into v_neg, v_nombre from logro where id = p_logro_id;
  if v_neg is null then raise exception 'logro_invalido'; end if; -- solo logros de negocio
  if not private.es_miembro_negocio(v_neg) then raise exception 'no_autorizado'; end if;

  insert into insignia_obtenida (cliente_id, logro_id)
  values (p_cliente_id, p_logro_id)
  on conflict (cliente_id, logro_id) do nothing;

  insert into notificacion (cliente_id, tipo, titulo, cuerpo, data)
  values (p_cliente_id, 'insignia', '¡Nueva insignia!', 'Ganaste la insignia: ' || v_nombre,
          jsonb_build_object('logro_id', p_logro_id));
end;
$$;
grant execute on function dar_insignia(uuid, uuid) to authenticated;
