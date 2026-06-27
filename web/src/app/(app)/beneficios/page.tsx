import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { BeneficiosClient, type Beneficio, type NivelOpcion } from './BeneficiosClient';

export default async function BeneficiosPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: beneficios }, { data: neg }, { data: niveles }] = await Promise.all([
    supabase
      .from('beneficio')
      .select(
        'id, nombre, descripcion, tipo, condicion_tipo, condicion_visitas, condicion_monto, vigencia_dias, valor_estimado, stock_total, cupo_dia, requiere_reserva, estado, nivel_membresia_id',
      )
      .eq('negocio_id', negocio!.id)
      .neq('estado', 'archivado')
      .order('creado_en', { ascending: false }),
    supabase.from('negocio').select('modelo_acumulacion').eq('id', negocio!.id).single(),
    supabase
      .from('nivel_membresia')
      .select('id, nombre')
      .eq('negocio_id', negocio!.id)
      .order('visitas_minimas', { ascending: true }),
  ]);

  return (
    <BeneficiosClient
      negocioId={negocio!.id}
      esPlus={neg?.modelo_acumulacion === 'plus'}
      niveles={(niveles as NivelOpcion[]) ?? []}
      inicial={(beneficios as Beneficio[]) ?? []}
    />
  );
}
