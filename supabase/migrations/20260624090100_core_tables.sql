-- =============================================================
-- 20260624090100_core_tables
-- Identidad multi-tenant + mecánica central (visitas, beneficios, canje).
-- =============================================================

-- ------------------------------------------------------------------
-- NEGOCIO (tenant raíz)
-- ------------------------------------------------------------------
create table negocio (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  tipo                text not null,
  descripcion         text,
  logo_url            text,
  direccion           text,
  lat                 double precision,
  lng                 double precision,
  telefono            text,
  modelo_acumulacion  modelo_acumulacion not null default 'basico',
  plan                tipo_plan not null default 'basico',
  estado              negocio_estado not null default 'prueba',
  prueba_hasta        date,
  radio_geocerca_m    integer,            -- null = geolocalización desactivada
  datos_fiscales      jsonb,
  creado_por          uuid references auth.users(id) default auth.uid(),  -- dueño fundador
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- ADMIN DE PLATAFORMA (equipo interno)
-- ------------------------------------------------------------------
create table plataforma_admin (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  nombre        text,
  creado_en     timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- USUARIO DE NEGOCIO (consolida Dueño + Personal, distinguidos por rol)
-- ------------------------------------------------------------------
create table usuario_negocio (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  negocio_id    uuid not null references negocio(id) on delete cascade,
  rol           rol_negocio not null default 'personal',
  nombre        text,
  permisos      jsonb not null default '{}'::jsonb,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (auth_user_id, negocio_id)
);
create index idx_usuario_negocio_negocio on usuario_negocio (negocio_id);
create index idx_usuario_negocio_auth    on usuario_negocio (auth_user_id);

-- ------------------------------------------------------------------
-- CLIENTE consumidor
-- ------------------------------------------------------------------
create table cliente (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references auth.users(id) on delete cascade,
  celular          text unique,
  nombre           text not null,
  cumpleanos       date,
  foto_url         text,
  codigo_referido  text not null unique
                     default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  puntos_globales  integer not null default 0,
  nivel_embajador  nivel_embajador not null default 'bronce',
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- NIVEL DE MEMBRESÍA (por negocio)
-- ------------------------------------------------------------------
create table nivel_membresia (
  id               uuid primary key default gen_random_uuid(),
  negocio_id       uuid not null references negocio(id) on delete cascade,
  nombre           text not null,
  visitas_minimas  integer not null default 0,
  orden            integer not null default 0,
  caduca_anual     boolean not null default false,
  creado_en        timestamptz not null default now()
);
create index idx_nivel_membresia_negocio on nivel_membresia (negocio_id);

-- ------------------------------------------------------------------
-- CLIENTE-NEGOCIO (relación / estado del cliente en cada negocio)
-- ------------------------------------------------------------------
create table cliente_negocio (
  id                  uuid primary key default gen_random_uuid(),
  cliente_id          uuid not null references cliente(id) on delete cascade,
  negocio_id          uuid not null references negocio(id) on delete cascade,
  visitas_totales     integer not null default 0,
  monto_acumulado     numeric(12,2) not null default 0,
  nivel_membresia_id  uuid references nivel_membresia(id) on delete set null,
  primera_visita      timestamptz,
  ultima_visita       timestamptz,
  bloqueado           boolean not null default false,
  notas               text,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  unique (cliente_id, negocio_id)
);
create index idx_cliente_negocio_negocio on cliente_negocio (negocio_id);
create index idx_cliente_negocio_cliente on cliente_negocio (cliente_id);

-- ------------------------------------------------------------------
-- QR DEL NEGOCIO (rotativo + firmado; un solo activo por negocio)
-- ------------------------------------------------------------------
create table negocio_qr (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references negocio(id) on delete cascade,
  token           text not null unique,
  codigo_respaldo text,                -- código numérico de 6 dígitos (respaldo)
  activo          boolean not null default true,
  generado_en     timestamptz not null default now(),
  expira_en       timestamptz not null
);
create index idx_negocio_qr_negocio on negocio_qr (negocio_id);
create unique index uq_negocio_qr_activo on negocio_qr (negocio_id) where activo;

-- ------------------------------------------------------------------
-- VISITA (registro; cliente escanea el QR del negocio)
-- ------------------------------------------------------------------
create table visita (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references cliente(id) on delete cascade,
  negocio_id  uuid not null references negocio(id) on delete cascade,
  monto       numeric(12,2),           -- solo Modelo Plus
  via         visita_via not null default 'qr',
  lat         double precision,
  lng         double precision,
  creado_en   timestamptz not null default now()
);
-- Regla anti-doble-escaneo (1 visita/cliente/negocio/24h) se valida en
-- Edge Function al registrar, no por constraint (la ventana es temporal).
create index idx_visita_negocio_fecha on visita (negocio_id, creado_en);
create index idx_visita_cliente_neg   on visita (cliente_id, negocio_id, creado_en);

-- ------------------------------------------------------------------
-- BENEFICIO (configurado por el dueño; 8 tipos)
-- ------------------------------------------------------------------
create table beneficio (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references negocio(id) on delete cascade,
  nombre            text not null,
  descripcion       text,
  foto_url          text,
  tipo              tipo_beneficio not null,
  condicion_tipo    condicion_tipo not null default 'visitas',
  condicion_visitas integer,
  condicion_monto   numeric(12,2),
  vigencia_dias     integer not null default 30,
  valor_estimado    numeric(12,2),
  cupo_dia          integer,
  cupo_semana       integer,
  cupo_mes          integer,
  stock_total       integer,
  horario           jsonb,             -- días/horas permitidas para canjear
  requiere_reserva  boolean not null default false,
  estado            beneficio_estado not null default 'activo',
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);
create index idx_beneficio_negocio on beneficio (negocio_id);

-- ------------------------------------------------------------------
-- BENEFICIO DESBLOQUEADO (instancia que gana un cliente)
-- ------------------------------------------------------------------
create table beneficio_desbloqueado (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references cliente(id) on delete cascade,
  beneficio_id    uuid not null references beneficio(id) on delete cascade,
  negocio_id      uuid not null references negocio(id) on delete cascade,  -- denormalizado para RLS
  estado          beneficio_desbloqueado_estado not null default 'disponible',
  desbloqueado_en timestamptz not null default now(),
  vence_en        timestamptz,
  creado_en       timestamptz not null default now()
);
create index idx_bd_cliente_estado on beneficio_desbloqueado (cliente_id, estado);
create index idx_bd_negocio        on beneficio_desbloqueado (negocio_id);

-- ------------------------------------------------------------------
-- CANJE (personal escanea el código temporal del cliente)
-- ------------------------------------------------------------------
create table canje (
  id                        uuid primary key default gen_random_uuid(),
  beneficio_desbloqueado_id uuid not null unique references beneficio_desbloqueado(id) on delete cascade,
  negocio_id                uuid not null references negocio(id) on delete cascade,
  cliente_id                uuid not null references cliente(id) on delete cascade,
  validado_por              uuid references usuario_negocio(id) on delete set null,
  metodo                    canje_metodo not null default 'qr',
  codigo_temporal           text,
  creado_en                 timestamptz not null default now()
);
create index idx_canje_negocio_fecha on canje (negocio_id, creado_en);
