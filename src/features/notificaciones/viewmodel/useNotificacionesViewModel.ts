import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  creada_en: string;
  leida_en: string | null;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; notificaciones: Notificacion[] };

export function useNotificacionesViewModel(clienteId: string) {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    if (!clienteId) {
      setState({ status: 'listo', notificaciones: [] });
      return;
    }
    setState({ status: 'cargando' });
    const { data, error } = await supabase
      .from('notificacion')
      .select('id, tipo, titulo, cuerpo, creada_en, leida_en')
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })
      .limit(100);

    if (error) {
      setState({ status: 'error', mensaje: error.message });
      return;
    }
    const lista = (data as Notificacion[]) ?? [];
    setState({ status: 'listo', notificaciones: lista });

    // Marcar como leídas las no leídas.
    const sinLeer = lista.filter(n => !n.leida_en).map(n => n.id);
    if (sinLeer.length > 0) {
      supabase.from('notificacion').update({ leida_en: new Date().toISOString() }).in('id', sinLeer);
    }
  }, [clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state };
}
