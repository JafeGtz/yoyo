-- =============================================================
-- 20260626130000_storage_buckets
-- Buckets de Storage para imágenes (logos de negocio y catálogo).
-- Públicos para lectura; escritura por usuarios autenticados.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true),
       ('catalogo', 'catalogo', true)
on conflict (id) do nothing;

create policy "imagenes_lectura_publica" on storage.objects
  for select to public
  using (bucket_id in ('logos', 'catalogo'));

create policy "imagenes_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('logos', 'catalogo'));

create policy "imagenes_update_auth" on storage.objects
  for update to authenticated
  using (bucket_id in ('logos', 'catalogo'));

create policy "imagenes_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id in ('logos', 'catalogo'));
