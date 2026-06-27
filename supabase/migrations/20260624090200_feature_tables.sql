-- =============================================================
-- 20260624090200_feature_tables
-- Competencia, referidos, reseñas, notificaciones, citas, catálogo,
-- pagos y publicidad.
-- =============================================================

-- ------------------------------------------------------------------
-- REFERIDO
-- ------------------------------------------------------------------
create table referido (
  id                   uuid primary key default gen_random_uuid(),
  referidor_cliente_id uuid not null references cliente(id) on delete cascade,
  referido_cliente_id  uuid references cliente(id) on delete set null,
  codigo_usado         text not null,
  estado               referido_estado not null default 'pendiente',
  creado_en            timestamptz not null default now(),
  completado_en        timestamptz
);
create index idx_referido_referidor on referido (referidor_cliente_id);

-- ------------------------------------------------------------------
-- RETO (negocio o global)
-- ------------------------------------------------------------------
create table reto (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid references negocio(id) on delete cascade,  -- null = global
  ambito       reto_ambito not null default 'negocio',
  nombre       text not null,
  descripcion  text,
  condiciones  jsonb not null default '{}'::jsonb,
  recompensa   jsonb not null default '{}'::jsonb,
  inicia_en    timestamptz,
  vence_en     timestamptz,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  constraint reto_ambito_chk check (
    (ambito = 'global'  and negocio_id is null) or
    (ambito = 'negocio' and negocio_id is not null)
  )
);
create index idx_reto_negocio on reto (negocio_id);

-- ------------------------------------------------------------------
-- RETO-PROGRESO
-- ------------------------------------------------------------------
create table reto_progreso (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references cliente(id) on delete cascade,
  reto_id        uuid not null references reto(id) on delete cascade,
  progreso       integer not null default 0,
  meta           integer not null default 1,
  estado         reto_progreso_estado not null default 'en_progreso',
  actualizado_en timestamptz not null default now(),
  unique (cliente_id, reto_id)
);

-- ------------------------------------------------------------------
-- LOGRO (insignia configurable, negocio o global)
-- ------------------------------------------------------------------
create table logro (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid references negocio(id) on delete cascade,  -- null = global
  ambito       logro_ambito not null default 'global',
  nombre       text not null,
  descripcion  text,
  icono        text,
  condicion    jsonb not null default '{}'::jsonb,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  constraint logro_ambito_chk check (
    (ambito = 'global'  and negocio_id is null) or
    (ambito = 'negocio' and negocio_id is not null)
  )
);

-- ------------------------------------------------------------------
-- INSIGNIA OBTENIDA
-- ------------------------------------------------------------------
create table insignia_obtenida (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references cliente(id) on delete cascade,
  logro_id    uuid not null references logro(id) on delete cascade,
  obtenida_en timestamptz not null default now(),
  unique (cliente_id, logro_id)
);

-- ------------------------------------------------------------------
-- RIFA
-- ------------------------------------------------------------------
create table rifa (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocio(id) on delete cascade,
  nombre             text not null,
  premio             text,
  criterio           jsonb not null default '{}'::jsonb,
  cierra_en          timestamptz,
  ganador_cliente_id uuid references cliente(id) on delete set null,
  estado             rifa_estado not null default 'abierta',
  creado_en          timestamptz not null default now()
);
create index idx_rifa_negocio on rifa (negocio_id);

-- ------------------------------------------------------------------
-- RESEÑA (privada en MVP; pública curada por el dueño — ADR-03)
-- ------------------------------------------------------------------
create table resena (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid not null references cliente(id) on delete cascade,
  negocio_id         uuid not null references negocio(id) on delete cascade,
  canje_id           uuid references canje(id) on delete set null,
  estrellas          smallint check (estrellas between 1 and 5),
  comentario         text,
  nps                smallint check (nps between 0 and 10),
  visibilidad        resena_visibilidad not null default 'privada',
  aprobada_por_dueno boolean not null default false,
  creada_en          timestamptz not null default now()
);
create index idx_resena_negocio_fecha on resena (negocio_id, creada_en);

-- ------------------------------------------------------------------
-- NOTIFICACIÓN
-- ------------------------------------------------------------------
create table notificacion (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references cliente(id) on delete cascade,
  tipo        text not null,
  titulo      text not null,
  cuerpo      text,
  data        jsonb not null default '{}'::jsonb,
  leida_en    timestamptz,
  creada_en   timestamptz not null default now()
);
create index idx_notificacion_cliente on notificacion (cliente_id, creada_en);

-- ------------------------------------------------------------------
-- DISPOSITIVO PUSH (tokens FCM; cliente o usuario de negocio)
-- ------------------------------------------------------------------
create table dispositivo_push (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid references cliente(id) on delete cascade,
  usuario_negocio_id uuid references usuario_negocio(id) on delete cascade,
  token              text not null unique,
  plataforma         plataforma_dispositivo not null,
  creado_en          timestamptz not null default now(),
  constraint dispositivo_dueno_chk check (
    cliente_id is not null or usuario_negocio_id is not null
  )
);

-- ------------------------------------------------------------------
-- CATÁLOGO / MENÚ del negocio
-- ------------------------------------------------------------------
create table catalogo_categoria (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocio(id) on delete cascade,
  nombre      text not null,
  orden       integer not null default 0,
  creado_en   timestamptz not null default now()
);
create index idx_catalogo_categoria_negocio on catalogo_categoria (negocio_id);

create table catalogo_item (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid not null references negocio(id) on delete cascade,
  categoria_id uuid references catalogo_categoria(id) on delete set null,
  nombre       text not null,
  descripcion  text,
  precio       numeric(12,2),
  foto_url     text,
  orden        integer not null default 0,
  creado_en    timestamptz not null default now()
);
create index idx_catalogo_item_negocio on catalogo_item (negocio_id);

-- ------------------------------------------------------------------
-- CITA (agenda opcional)
-- ------------------------------------------------------------------
create table cita (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references cliente(id) on delete cascade,
  negocio_id      uuid not null references negocio(id) on delete cascade,
  catalogo_item_id uuid references catalogo_item(id) on delete set null,
  servicio        text,
  inicia_en       timestamptz not null,
  duracion_min    integer not null default 30,
  estado          cita_estado not null default 'pendiente',
  creado_en       timestamptz not null default now()
);
create index idx_cita_negocio_fecha on cita (negocio_id, inicia_en);

-- ------------------------------------------------------------------
-- PAGO DE SUSCRIPCIÓN
-- ------------------------------------------------------------------
create table pago_suscripcion (
  id             uuid primary key default gen_random_uuid(),
  negocio_id     uuid not null references negocio(id) on delete cascade,
  monto          numeric(12,2) not null,
  moneda         text not null default 'MXN',
  metodo         text,
  proveedor_ref  text,
  estado         pago_estado not null default 'pendiente',
  periodo_inicio date,
  periodo_fin    date,
  creado_en      timestamptz not null default now()
);
create index idx_pago_negocio_fecha on pago_suscripcion (negocio_id, creado_en);

-- ------------------------------------------------------------------
-- ANUNCIO (plataforma publicitaria, fase posterior)
-- ------------------------------------------------------------------
create table anuncio (
  id                    uuid primary key default gen_random_uuid(),
  anunciante_negocio_id uuid references negocio(id) on delete set null,
  formato               anuncio_formato not null,
  contenido             jsonb not null default '{}'::jsonb,
  segmentacion          jsonb not null default '{}'::jsonb,
  presupuesto           numeric(12,2),
  inicia_en             timestamptz,
  termina_en            timestamptz,
  metricas              jsonb not null default '{}'::jsonb,
  estado                anuncio_estado not null default 'borrador',
  creado_en             timestamptz not null default now()
);
create index idx_anuncio_estado on anuncio (estado);
