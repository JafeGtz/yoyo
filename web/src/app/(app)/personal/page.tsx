import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { PersonalClient, type Empleado } from './PersonalClient';

export default async function PersonalPage() {
  const { negocio, rol } = await getSesion();
  const supabase = await createClient();
  const { data } = await supabase
    .from('usuario_negocio')
    .select('id, nombre, activo')
    .eq('negocio_id', negocio!.id)
    .eq('rol', 'personal')
    .order('creado_en', { ascending: false });

  return (
    <PersonalClient
      negocioId={negocio!.id}
      esDueno={rol === 'dueno'}
      inicial={(data as Empleado[]) ?? []}
    />
  );
}
