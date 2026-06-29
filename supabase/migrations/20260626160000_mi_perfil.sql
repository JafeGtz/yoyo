-- =============================================================
-- 20260626160000_mi_perfil
-- Detección de rol del usuario autenticado para la app (consumidor /
-- empleado / dueño / admin). La app llama este RPC tras el login y enruta.
-- =============================================================

create or replace function mi_perfil()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from plataforma_admin where auth_user_id = auth.uid())
      then jsonb_build_object('rol', 'admin')
    when exists (select 1 from usuario_negocio where auth_user_id = auth.uid() and activo)
      then (
        select jsonb_build_object('rol', un.rol, 'negocio_id', un.negocio_id, 'nombre', un.nombre)
        from usuario_negocio un
        where un.auth_user_id = auth.uid() and un.activo
        limit 1
      )
    when exists (select 1 from cliente where auth_user_id = auth.uid())
      then (
        select jsonb_build_object('rol', 'consumidor', 'cliente_id', c.id, 'nombre', c.nombre)
        from cliente c where c.auth_user_id = auth.uid()
      )
    else jsonb_build_object('rol', null)
  end;
$$;

grant execute on function mi_perfil() to authenticated;
