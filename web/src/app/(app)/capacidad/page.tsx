import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { CapacidadClient, type BeneficioCap } from './CapacidadClient';

export default async function CapacidadPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const { data } = await supabase
    .from('beneficio')
    .select('id, nombre, estado, cupo_dia, cupo_semana, cupo_mes, stock_total, horario')
    .eq('negocio_id', negocio!.id)
    .neq('estado', 'archivado')
    .order('creado_en', { ascending: false });

  return <CapacidadClient inicial={(data as BeneficioCap[]) ?? []} />;
}
