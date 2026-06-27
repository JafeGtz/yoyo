-- =============================================================
-- 20260624090400_rls_policies
-- Row Level Security. Modelo:
--   • Cliente: solo sus propios datos.
--   • Negocio (dueño/personal): datos de su(s) negocio(s) vía es_miembro_negocio().
--   • Admin de plataforma: acceso global.
--   • Operaciones sensibles (registro de visita, canje, rotación de QR,
--     envío de notificaciones) corren en Edge Functions con service_role,
--     que ignora RLS — por eso varias tablas no tienen INSERT para clientes.
-- =============================================================

alter table negocio                enable row level security;
alter table plataforma_admin        enable row level security;
alter table usuario_negocio         enable row level security;
alter table cliente                 enable row level security;
alter table nivel_membresia         enable row level security;
alter table cliente_negocio         enable row level security;
alter table negocio_qr              enable row level security;
alter table visita                  enable row level security;
alter table beneficio               enable row level security;
alter table beneficio_desbloqueado  enable row level security;
alter table canje                   enable row level security;
alter table referido                enable row level security;
alter table reto                    enable row level security;
alter table reto_progreso           enable row level security;
alter table logro                   enable row level security;
alter table insignia_obtenida       enable row level security;
alter table rifa                    enable row level security;
alter table resena                  enable row level security;
alter table notificacion            enable row level security;
alter table dispositivo_push        enable row level security;
alter table catalogo_categoria      enable row level security;
alter table catalogo_item           enable row level security;
alter table cita                    enable row level security;
alter table pago_suscripcion        enable row level security;
alter table anuncio                 enable row level security;

-- ------------------------------------------------------------------
-- NEGOCIO
-- ------------------------------------------------------------------
create policy negocio_select_member on negocio for select to authenticated
  using (private.es_miembro_negocio(id) or private.es_admin());
create policy negocio_select_creador on negocio for select to authenticated
  using (creado_por = auth.uid());      -- permite RETURNING en el onboarding
create policy negocio_select_discovery on negocio for select to authenticated
  using (estado = 'activo');
create policy negocio_insert on negocio for insert to authenticated
  with check (true);
create policy negocio_update_member on negocio for update to authenticated
  using (private.es_miembro_negocio(id) or private.es_admin())
  with check (private.es_miembro_negocio(id) or private.es_admin());
create policy negocio_delete_admin on negocio for delete to authenticated
  using (private.es_admin());

-- ------------------------------------------------------------------
-- PLATAFORMA_ADMIN (solo lectura para admins; alta vía service_role)
-- ------------------------------------------------------------------
create policy pa_select on plataforma_admin for select to authenticated
  using (private.es_admin());

-- ------------------------------------------------------------------
-- USUARIO_NEGOCIO
-- ------------------------------------------------------------------
create policy un_select on usuario_negocio for select to authenticated
  using (auth_user_id = auth.uid() or private.es_miembro_negocio(negocio_id) or private.es_admin());
-- Auto-alta SOLO como dueño fundador (negocio sin miembros); o un miembro
-- existente agrega personal. Evita que alguien se asigne a un negocio ajeno.
create policy un_insert on usuario_negocio for insert to authenticated
  with check (
    (auth_user_id = auth.uid() and private.negocio_sin_miembros(negocio_id))
    or private.es_miembro_negocio(negocio_id)
  );
create policy un_update on usuario_negocio for update to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy un_delete on usuario_negocio for delete to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- CLIENTE (propio + negocios donde está registrado pueden leerlo)
-- ------------------------------------------------------------------
create policy cliente_select on cliente for select to authenticated
  using (
    auth_user_id = auth.uid()
    or private.es_admin()
    or exists (
      select 1 from cliente_negocio cn
      where cn.cliente_id = cliente.id and private.es_miembro_negocio(cn.negocio_id)
    )
  );
create policy cliente_insert on cliente for insert to authenticated
  with check (auth_user_id = auth.uid());
create policy cliente_update on cliente for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy cliente_delete on cliente for delete to authenticated
  using (auth_user_id = auth.uid() or private.es_admin());

-- ------------------------------------------------------------------
-- NIVEL_MEMBRESIA (lectura abierta; escritura por miembros)
-- ------------------------------------------------------------------
create policy nm_select on nivel_membresia for select to authenticated using (true);
create policy nm_write on nivel_membresia for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- CLIENTE_NEGOCIO
-- ------------------------------------------------------------------
create policy cn_select on cliente_negocio for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy cn_write on cliente_negocio for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- NEGOCIO_QR (solo miembros; clientes validan vía Edge Function)
-- ------------------------------------------------------------------
create policy qr_write on negocio_qr for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- VISITA (registro vía Edge Function; miembros pueden ajustar)
-- ------------------------------------------------------------------
create policy visita_select on visita for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy visita_write on visita for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- BENEFICIO (clientes ven activos; miembros administran)
-- ------------------------------------------------------------------
create policy ben_select on beneficio for select to authenticated
  using (estado = 'activo' or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy ben_write on beneficio for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- BENEFICIO_DESBLOQUEADO (desbloqueo/canje vía Edge Function)
-- ------------------------------------------------------------------
create policy bd_select on beneficio_desbloqueado for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy bd_write on beneficio_desbloqueado for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- CANJE
-- ------------------------------------------------------------------
create policy canje_select on canje for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy canje_write on canje for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- REFERIDO
-- ------------------------------------------------------------------
create policy ref_select on referido for select to authenticated
  using (referidor_cliente_id = private.cliente_actual()
         or referido_cliente_id = private.cliente_actual()
         or private.es_admin());
create policy ref_insert on referido for insert to authenticated
  with check (referidor_cliente_id = private.cliente_actual());

-- ------------------------------------------------------------------
-- RETO (lectura de activos; miembros/admin administran)
-- ------------------------------------------------------------------
create policy reto_select on reto for select to authenticated
  using (activo or (negocio_id is not null and private.es_miembro_negocio(negocio_id)) or private.es_admin());
create policy reto_write on reto for all to authenticated
  using ((negocio_id is not null and private.es_miembro_negocio(negocio_id)) or private.es_admin())
  with check ((negocio_id is not null and private.es_miembro_negocio(negocio_id)) or private.es_admin());

-- ------------------------------------------------------------------
-- RETO_PROGRESO
-- ------------------------------------------------------------------
create policy rp_select on reto_progreso for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_admin());
create policy rp_self on reto_progreso for all to authenticated
  using (cliente_id = private.cliente_actual())
  with check (cliente_id = private.cliente_actual());

-- ------------------------------------------------------------------
-- LOGRO (lectura abierta; escritura miembro/admin)
-- ------------------------------------------------------------------
create policy logro_select on logro for select to authenticated using (true);
create policy logro_write on logro for all to authenticated
  using ((negocio_id is not null and private.es_miembro_negocio(negocio_id)) or private.es_admin())
  with check ((negocio_id is not null and private.es_miembro_negocio(negocio_id)) or private.es_admin());

-- ------------------------------------------------------------------
-- INSIGNIA_OBTENIDA (lectura propia; otorgada vía Edge Function)
-- ------------------------------------------------------------------
create policy io_select on insignia_obtenida for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_admin());

-- ------------------------------------------------------------------
-- RIFA (lectura abierta; escritura miembro/admin)
-- ------------------------------------------------------------------
create policy rifa_select on rifa for select to authenticated using (true);
create policy rifa_write on rifa for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- RESEÑA (cliente crea/edita la suya; dueño lee y aprueba; públicas
-- aprobadas visibles para todos)
-- ------------------------------------------------------------------
create policy resena_select on resena for select to authenticated
  using (cliente_id = private.cliente_actual()
         or private.es_miembro_negocio(negocio_id)
         or private.es_admin()
         or (visibilidad = 'publica' and aprobada_por_dueno));
create policy resena_insert on resena for insert to authenticated
  with check (cliente_id = private.cliente_actual());
create policy resena_update_self on resena for update to authenticated
  using (cliente_id = private.cliente_actual())
  with check (cliente_id = private.cliente_actual());
create policy resena_update_member on resena for update to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- NOTIFICACIÓN (lectura propia; marcar leída; envío vía service_role)
-- ------------------------------------------------------------------
create policy notif_select on notificacion for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_admin());
create policy notif_update_self on notificacion for update to authenticated
  using (cliente_id = private.cliente_actual())
  with check (cliente_id = private.cliente_actual());

-- ------------------------------------------------------------------
-- DISPOSITIVO_PUSH (cada quien gestiona sus tokens)
-- ------------------------------------------------------------------
create policy disp_self on dispositivo_push for all to authenticated
  using (
    cliente_id = private.cliente_actual()
    or usuario_negocio_id in (select id from usuario_negocio where auth_user_id = auth.uid())
  )
  with check (
    cliente_id = private.cliente_actual()
    or usuario_negocio_id in (select id from usuario_negocio where auth_user_id = auth.uid())
  );

-- ------------------------------------------------------------------
-- CATÁLOGO (lectura abierta; escritura miembro/admin)
-- ------------------------------------------------------------------
create policy cat_cat_select on catalogo_categoria for select to authenticated using (true);
create policy cat_cat_write on catalogo_categoria for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

create policy cat_item_select on catalogo_item for select to authenticated using (true);
create policy cat_item_write on catalogo_item for all to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- CITA (cliente y negocio gestionan)
-- ------------------------------------------------------------------
create policy cita_select on cita for select to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());
create policy cita_insert on cita for insert to authenticated
  with check (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id));
create policy cita_update on cita for update to authenticated
  using (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin())
  with check (cliente_id = private.cliente_actual() or private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- PAGO_SUSCRIPCION (lectura miembro/admin; alta vía service_role/webhook)
-- ------------------------------------------------------------------
create policy pago_select on pago_suscripcion for select to authenticated
  using (private.es_miembro_negocio(negocio_id) or private.es_admin());

-- ------------------------------------------------------------------
-- ANUNCIO (clientes ven activos; anunciante ve los suyos; admin todo)
-- ------------------------------------------------------------------
create policy anuncio_select on anuncio for select to authenticated
  using (estado = 'activo'
         or (anunciante_negocio_id is not null and private.es_miembro_negocio(anunciante_negocio_id))
         or private.es_admin());
create policy anuncio_write on anuncio for all to authenticated
  using (private.es_admin() or (anunciante_negocio_id is not null and private.es_miembro_negocio(anunciante_negocio_id)))
  with check (private.es_admin() or (anunciante_negocio_id is not null and private.es_miembro_negocio(anunciante_negocio_id)));
