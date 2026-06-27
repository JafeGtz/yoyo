import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { CampanasClient, type Campana } from './CampanasClient';

export default async function CampanasPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const { data } = await supabase
    .from('campana')
    .select('id, titulo, mensaje, segmento, estado, enviados, creado_en')
    .eq('negocio_id', negocio!.id)
    .order('creado_en', { ascending: false });

  return <CampanasClient negocioId={negocio!.id} inicial={(data as Campana[]) ?? []} />;
}
