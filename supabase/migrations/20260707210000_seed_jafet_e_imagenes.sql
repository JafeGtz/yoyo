-- =============================================================
-- 20260707210000_seed_jafet_e_imagenes
-- (1) Imágenes para TODOS los negocios (logo + portada) y productos,
--     usando picsum.photos (deterministas por id) para el demo.
-- (2) Jafet visita 2 negocios más (Café Aroma y La Parrilla del Centro).
-- =============================================================

-- (1) Logos de perfil (redondeados en la app) para negocios sin logo.
update negocio
set logo_url = 'https://picsum.photos/seed/logo' || replace(id::text, '-', '') || '/200/200'
where logo_url is null or logo_url = '';

-- Portadas (banner) para los que no tengan.
update negocio
set portada_url = 'https://picsum.photos/seed/banner' || replace(id::text, '-', '') || '/900/400'
where portada_url is null or portada_url = '';

-- Fotos de productos para el catálogo sin imagen.
update catalogo_item
set foto_url = 'https://picsum.photos/seed/prod' || replace(id::text, '-', '') || '/400/400'
where foto_url is null or foto_url = '';

-- (2) Jafet en 2 negocios más.
do $$
declare
  j    uuid := '6fd8a06d-73ee-43eb-ba35-569e001dd4c1';  -- cliente Jafet
  cafe uuid := '7809b207-a216-48ce-be91-9ee9dab8bb39';  -- Café Aroma
  parr uuid := 'c2dee5bd-9322-4e0d-bfab-fa99d690f6ed';  -- La Parrilla del Centro
begin
  -- cliente_negocio (el trigger asigna el nivel de membresía según visitas).
  insert into cliente_negocio (cliente_id, negocio_id, visitas_totales, monto_acumulado, primera_visita, ultima_visita)
  values
    (j, cafe, 12, 1840, now() - interval '38 days', now() - interval '2 days'),
    (j, parr, 8,  3120, now() - interval '46 days', now() - interval '1 day')
  on conflict (cliente_id, negocio_id) do update
    set visitas_totales = excluded.visitas_totales,
        monto_acumulado = excluded.monto_acumulado;

  -- Visitas históricas (para historial y ranking). El trigger de gamificación corre normal.
  if not exists (select 1 from visita where cliente_id = j and negocio_id = cafe) then
    insert into visita (cliente_id, negocio_id, via, creado_en, monto)
    select j, cafe, 'qr', now() - (g * interval '3 days'), 110 + g * 12
    from generate_series(1, 12) g;
  end if;

  if not exists (select 1 from visita where cliente_id = j and negocio_id = parr) then
    insert into visita (cliente_id, negocio_id, via, creado_en, monto)
    select j, parr, 'qr', now() - (g * interval '5 days'), 320 + g * 25
    from generate_series(1, 8) g;
  end if;
end $$;
