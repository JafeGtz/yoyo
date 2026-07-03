import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { CapacidadClient, type BeneficioCap } from './CapacidadClient';

interface ResumenRow {
  beneficio_id: string;
  reservados: number;
  canjeados: number;
  canjes_mes: number;
  costo_mes: number;
}

export default async function CapacidadPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const [{ data: bens }, { data: resumen }] = await Promise.all([
    supabase
      .from('beneficio')
      .select('id, nombre, estado, stock_total, valor_estimado, vigencia_dias')
      .eq('negocio_id', negocio!.id)
      .neq('estado', 'archivado')
      .order('creado_en', { ascending: false }),
    supabase.rpc('capacidad_resumen', { p_negocio_id: negocio!.id }),
  ]);

  const mapa = new Map((resumen as ResumenRow[] ?? []).map(r => [r.beneficio_id, r]));
  const lista: BeneficioCap[] = (bens as Omit<BeneficioCap, 'reservados' | 'canjeados' | 'canjes_mes' | 'costo_mes'>[] ?? []).map(b => {
    const r = mapa.get(b.id);
    return {
      ...b,
      reservados: Number(r?.reservados ?? 0),
      canjeados: Number(r?.canjeados ?? 0),
      canjes_mes: Number(r?.canjes_mes ?? 0),
      costo_mes: Number(r?.costo_mes ?? 0),
    };
  });

  return <CapacidadClient inicial={lista} />;
}
