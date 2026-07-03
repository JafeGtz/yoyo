import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { MembresiasClient, type Nivel, type Criterio } from './MembresiasClient';

export default async function MembresiasPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: niveles }, { data: beneficios }, { data: neg }] = await Promise.all([
    supabase
      .from('nivel_membresia')
      .select('id, nombre, visitas_minimas, monto_minimo, orden, caduca_anual')
      .eq('negocio_id', negocio!.id)
      .order('visitas_minimas', { ascending: true }),
    supabase
      .from('beneficio')
      .select('id, nombre, nivel_membresia_id')
      .eq('negocio_id', negocio!.id)
      .not('nivel_membresia_id', 'is', null),
    supabase.from('negocio').select('nivel_criterio').eq('id', negocio!.id).single(),
  ]);

  return (
    <MembresiasClient
      negocioId={negocio!.id}
      inicial={(niveles as Nivel[]) ?? []}
      beneficiosPorNivel={(beneficios as { id: string; nombre: string; nivel_membresia_id: string }[]) ?? []}
      criterioInicial={(neg?.nivel_criterio as Criterio) ?? 'visitas'}
    />
  );
}
