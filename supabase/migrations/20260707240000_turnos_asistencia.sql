-- =============================================================
-- 20260707240000_turnos_asistencia
-- Gestión de turnos (horarios de empleados) y asistencia (check-in/out).
-- =============================================================

-- Turno: horario asignado a un empleado en una fecha.
create table turno (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocio(id) on delete cascade,
  usuario_negocio_id uuid not null references usuario_negocio(id) on delete cascade,
  fecha              date not null,
  hora_inicio        time not null,
  hora_fin           time not null,
  notas              text,
  creado_en          timestamptz not null default now()
);
create index turno_negocio_fecha_idx on turno (negocio_id, fecha);

-- Asistencia: entrada/salida real del empleado.
create table asistencia (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocio(id) on delete cascade,
  usuario_negocio_id uuid not null references usuario_negocio(id) on delete cascade,
  entrada            timestamptz not null default now(),
  salida             timestamptz,
  creado_en          timestamptz not null default now()
);
create index asistencia_negocio_entrada_idx on asistencia (negocio_id, entrada);

alter table turno      enable row level security;
alter table asistencia enable row level security;

-- Miembros del negocio (dueño o personal activo) pueden leer/escribir.
create policy turno_all on turno for all to authenticated
  using (private.es_miembro_negocio(negocio_id))
  with check (private.es_miembro_negocio(negocio_id));

create policy asistencia_all on asistencia for all to authenticated
  using (private.es_miembro_negocio(negocio_id))
  with check (private.es_miembro_negocio(negocio_id));

-- mi_perfil: incluir usuario_negocio_id (para que el empleado marque su asistencia).
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
        select jsonb_build_object('rol', un.rol, 'negocio_id', un.negocio_id, 'nombre', un.nombre, 'usuario_negocio_id', un.id)
        from usuario_negocio un
        where un.auth_user_id = auth.uid() and un.activo
        limit 1
      )
    when exists (select 1 from cliente where auth_user_id = auth.uid())
      then (
        select jsonb_build_object('rol', 'consumidor', 'cliente_id', c.id, 'nombre', c.nombre, 'foto_url', c.foto_url)
        from cliente c where c.auth_user_id = auth.uid()
      )
    else jsonb_build_object('rol', null)
  end;
$$;

grant execute on function mi_perfil() to authenticated;
