-- =============================================================
-- 20260628150000_negocio_portada
-- Imagen de portada del negocio (la sube el dueño en el SaaS; la app la
-- usa en el carrusel de descubrimiento).
-- =============================================================

alter table negocio add column portada_url text;
