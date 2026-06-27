-- =============================================================
-- 20260624090000_extensions_and_enums
-- Extensiones y tipos enumerados del dominio.
-- Sistema de Fidelización Digital — ver docs/analisis-y-requerimientos-v2.md (sección 11).
-- =============================================================

create extension if not exists pgcrypto;

-- --- Negocio / planes -----------------------------------------
create type modelo_acumulacion as enum ('basico', 'plus');
create type negocio_estado    as enum ('prueba', 'activo', 'suspendido', 'cancelado');
create type tipo_plan         as enum ('basico', 'plus', 'premium');
create type rol_negocio       as enum ('dueno', 'personal');

-- --- Beneficios y canje ---------------------------------------
create type tipo_beneficio as enum (
  'producto_gratis',
  'servicio_gratis',
  'descuento_porcentual',
  'descuento_fijo',
  'upgrade',
  'combo_2x1',
  'acceso_exclusivo',
  'regalo_sorpresa'
);
create type condicion_tipo as enum ('visitas', 'monto', 'combinado');
create type beneficio_estado as enum ('activo', 'pausado', 'archivado');
create type beneficio_desbloqueado_estado as enum (
  'disponible', 'agotado_cupo', 'pausado', 'vencido', 'canjeado'
);
create type canje_metodo as enum ('qr', 'codigo_numerico');
create type visita_via   as enum ('qr', 'codigo_numerico');

-- --- Competencia / gamificación -------------------------------
create type nivel_embajador      as enum ('bronce', 'plata', 'oro', 'platino', 'diamante');
create type reto_ambito          as enum ('negocio', 'global');
create type reto_progreso_estado as enum ('en_progreso', 'completado', 'expirado');
create type logro_ambito         as enum ('negocio', 'global');
create type rifa_estado          as enum ('abierta', 'cerrada', 'sorteada');

-- --- Reseñas, referidos, citas, pagos -------------------------
create type resena_visibilidad as enum ('privada', 'publica');
create type referido_estado    as enum ('pendiente', 'completado', 'expirado');
create type cita_estado        as enum ('pendiente', 'confirmada', 'cancelada', 'completada');
create type pago_estado        as enum ('pendiente', 'pagado', 'fallido', 'reembolsado');

-- --- Publicidad / dispositivos --------------------------------
create type anuncio_formato        as enum ('banner', 'destacado', 'notificacion', 'cross_promotion', 'featured_semana');
create type anuncio_estado         as enum ('borrador', 'activo', 'pausado', 'finalizado');
create type plataforma_dispositivo as enum ('ios', 'android');
