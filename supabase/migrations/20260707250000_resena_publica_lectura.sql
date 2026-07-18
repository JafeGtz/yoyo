-- =============================================================
-- 20260707250000_resena_publica_lectura
-- Permite a cualquier usuario autenticado leer las reseñas que el dueño
-- aprobó como públicas (para mostrarlas en el detalle del negocio en la app).
-- =============================================================

create policy resena_select_publica on resena for select to authenticated
  using (aprobada_por_dueno = true);
