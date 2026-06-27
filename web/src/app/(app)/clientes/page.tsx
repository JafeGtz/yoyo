import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { ClientesClient, type FilaCliente } from './ClientesClient';

export default async function ClientesPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data }, { data: neg }] = await Promise.all([
    supabase
      .from('cliente_negocio')
      .select(
        'id, visitas_totales, monto_acumulado, ultima_visita, bloqueado, cliente:cliente_id(nombre, celular), nivel:nivel_membresia_id(nombre)',
      )
      .eq('negocio_id', negocio!.id)
      .order('ultima_visita', { ascending: false }),
    supabase.from('negocio').select('modelo_acumulacion').eq('id', negocio!.id).single(),
  ]);

  return (
    <ClientesClient
      filas={(data as unknown as FilaCliente[]) ?? []}
      esPlus={neg?.modelo_acumulacion === 'plus'}
    />
  );
}
