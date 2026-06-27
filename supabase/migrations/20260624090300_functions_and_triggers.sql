-- =============================================================
-- 20260624090300_functions_and_triggers
-- Helpers de RLS (schema privado, no expuesto vía API) + triggers
-- de actualizado_en.
-- =============================================================

create schema if not exists private;

-- Los roles de la API necesitan poder USAR el esquema y EJECUTAR los
-- helpers desde las políticas RLS. (service_role ignora RLS, pero se
-- incluye por consistencia.) Las tablas internas siguen sin exponerse
-- vía PostgREST porque 'private' no está en los esquemas expuestos.
grant usage on schema private to authenticated, anon, service_role;

-- ¿El usuario autenticado es miembro (dueño/personal) del negocio dado?
-- SECURITY DEFINER: corre como dueño de las tablas y evita recursión de RLS.
create or replace function private.es_miembro_negocio(p_negocio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from usuario_negocio
    where auth_user_id = auth.uid()
      and negocio_id = p_negocio_id
      and activo
  );
$$;

-- cliente_id del usuario autenticado (null si no es cliente).
create or replace function private.cliente_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from cliente where auth_user_id = auth.uid();
$$;

-- ¿El negocio aún no tiene miembros? Permite el alta del dueño fundador
-- durante el onboarding sin abrir la puerta a que alguien se auto-asigne
-- a un negocio ajeno ya existente. SECURITY DEFINER para ignorar RLS.
create or replace function private.negocio_sin_miembros(p_negocio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from usuario_negocio where negocio_id = p_negocio_id
  );
$$;

-- ¿El usuario autenticado es admin de plataforma?
create or replace function private.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from plataforma_admin where auth_user_id = auth.uid()
  );
$$;

-- --- Trigger genérico de actualizado_en ----------------------------
create or replace function private.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trg_negocio_upd          before update on negocio          for each row execute function private.set_actualizado_en();
create trigger trg_usuario_negocio_upd  before update on usuario_negocio  for each row execute function private.set_actualizado_en();
create trigger trg_cliente_upd          before update on cliente          for each row execute function private.set_actualizado_en();
create trigger trg_cliente_negocio_upd  before update on cliente_negocio  for each row execute function private.set_actualizado_en();
create trigger trg_beneficio_upd        before update on beneficio        for each row execute function private.set_actualizado_en();
create trigger trg_reto_progreso_upd    before update on reto_progreso    for each row execute function private.set_actualizado_en();
