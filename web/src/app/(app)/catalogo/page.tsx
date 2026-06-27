import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { CatalogoClient, type Item, type Categoria } from './CatalogoClient';

export default async function CatalogoPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: categorias }, { data: items }] = await Promise.all([
    supabase.from('catalogo_categoria').select('id, nombre, orden').eq('negocio_id', negocio!.id).order('orden'),
    supabase
      .from('catalogo_item')
      .select('id, nombre, descripcion, precio, foto_url, categoria_id')
      .eq('negocio_id', negocio!.id)
      .order('creado_en', { ascending: false }),
  ]);

  return (
    <CatalogoClient
      negocioId={negocio!.id}
      categoriasIniciales={(categorias as Categoria[]) ?? []}
      itemsIniciales={(items as Item[]) ?? []}
    />
  );
}
