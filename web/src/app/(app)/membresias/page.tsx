import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { MembresiasClient, type Nivel } from './MembresiasClient';

export default async function MembresiasPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: niveles }, { data: beneficios }] = await Promise.all([
    supabase
      .from('nivel_membresia')
      .select('id, nombre, visitas_minimas, orden, caduca_anual')
      .eq('negocio_id', negocio!.id)
      .order('visitas_minimas', { ascending: true }),
    supabase
      .from('beneficio')
      .select('id, nombre, nivel_membresia_id')
      .eq('negocio_id', negocio!.id)
      .not('nivel_membresia_id', 'is', null),
  ]);

  return (
    <MembresiasClient
      negocioId={negocio!.id}
      inicial={(niveles as Nivel[]) ?? []}
      beneficiosPorNivel={(beneficios as { id: string; nombre: string; nivel_membresia_id: string }[]) ?? []}
    />
  );
}
