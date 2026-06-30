import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { QrClient } from './QrClient';
import { SeguridadVisita } from './SeguridadVisita';

export default async function QrPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const { data } = await supabase
    .from('negocio')
    .select('seguridad_visita')
    .eq('id', negocio!.id)
    .single();

  return (
    <div className="space-y-6">
      <QrClient negocioId={negocio!.id} />
      <SeguridadVisita
        negocioId={negocio!.id}
        inicial={(data?.seguridad_visita as 'abierto' | 'codigo') ?? 'abierto'}
      />
    </div>
  );
}
