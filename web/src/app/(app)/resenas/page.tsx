import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { ResenasClient, type Resena } from './ResenasClient';

export default async function ResenasPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const { data } = await supabase
    .from('resena')
    .select('id, estrellas, comentario, nps, visibilidad, aprobada_por_dueno, creada_en')
    .eq('negocio_id', negocio!.id)
    .order('creada_en', { ascending: false });

  return <ResenasClient inicial={(data as Resena[]) ?? []} />;
}
