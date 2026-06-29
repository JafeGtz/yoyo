import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  obtenida: boolean;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; insignias: Insignia[]; total: number };

export function useInsigniasViewModel(clienteId: string) {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    if (!clienteId) {
      setState({ status: 'listo', insignias: [], total: 0 });
      return;
    }
    setState({ status: 'cargando' });

    const [obtenidas, globales] = await Promise.all([
      supabase.from('insignia_obtenida').select('logro:logro_id(id, nombre, descripcion, icono)').eq('cliente_id', clienteId),
      supabase.from('logro').select('id, nombre, descripcion, icono').eq('ambito', 'global').eq('activo', true),
    ]);

    if (globales.error) {
      setState({ status: 'error', mensaje: globales.error.message });
      return;
    }

    const ganadas = (obtenidas.data as unknown as { logro: Insignia | null }[]) ?? [];
    const idsGanados = new Set(ganadas.map(g => g.logro?.id).filter(Boolean) as string[]);

    const base = (globales.data as { id: string; nombre: string; descripcion: string | null; icono: string | null }[]) ?? [];
    const lista: Insignia[] = base.map(l => ({ ...l, obtenida: idsGanados.has(l.id) }));

    // Insignias propias del negocio ya ganadas que no estén en las globales.
    for (const g of ganadas) {
      if (g.logro && !base.some(b => b.id === g.logro!.id)) {
        lista.push({ ...g.logro, obtenida: true });
      }
    }

    setState({ status: 'listo', insignias: lista, total: idsGanados.size });
  }, [clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state };
}
