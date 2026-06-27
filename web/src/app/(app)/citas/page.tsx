import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { CitasClient, type Cita, type ClienteOpcion } from './CitasClient';

export default async function CitasPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: citas }, { data: rels }] = await Promise.all([
    supabase
      .from('cita')
      .select('id, servicio, inicia_en, duracion_min, estado, cliente:cliente_id(nombre)')
      .eq('negocio_id', negocio!.id)
      .order('inicia_en', { ascending: true }),
    supabase
      .from('cliente_negocio')
      .select('cliente_id, cliente:cliente_id(nombre)')
      .eq('negocio_id', negocio!.id),
  ]);

  const clientes: ClienteOpcion[] = (rels as unknown as { cliente_id: string; cliente: { nombre: string } | null }[] ?? [])
    .map(r => ({ id: r.cliente_id, nombre: r.cliente?.nombre ?? '—' }));

  return (
    <CitasClient
      negocioId={negocio!.id}
      inicial={(citas as unknown as Cita[]) ?? []}
      clientes={clientes}
    />
  );
}
