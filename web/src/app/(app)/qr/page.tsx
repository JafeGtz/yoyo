import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { QrClient } from './QrClient';
import { SeguridadVisita } from './SeguridadVisita';

export default async function QrPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const [{ data }, { data: qr }] = await Promise.all([
    supabase.from('negocio').select('seguridad_visita').eq('id', negocio!.id).single(),
    supabase
      .from('negocio_qr')
      .select('token, codigo_respaldo, expira_en')
      .eq('negocio_id', negocio!.id)
      .eq('activo', true)
      .gt('expira_en', new Date().toISOString())
      .order('generado_en', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <QrClient
        negocioId={negocio!.id}
        inicialToken={qr?.token ?? null}
        inicialCodigo={qr?.codigo_respaldo ?? null}
        inicialExpira={qr?.expira_en ?? null}
      />
      <SeguridadVisita
        negocioId={negocio!.id}
        inicial={(data?.seguridad_visita as 'abierto' | 'codigo') ?? 'abierto'}
      />
    </div>
  );
}
