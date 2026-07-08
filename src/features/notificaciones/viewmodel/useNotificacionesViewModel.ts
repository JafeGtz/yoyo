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
    // Ya NO se marcan todas como leídas al abrir: el usuario distingue leídas/no leídas.
    setState({ status: 'listo', notificaciones: (data as Notificacion[]) ?? [] });
  }, [clienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Marca una como leída (optimista + persiste).
  const marcarLeida = useCallback(async (id: string) => {
    const ahora = new Date().toISOString();
    setState(s => s.status === 'listo'
      ? { ...s, notificaciones: s.notificaciones.map(n => n.id === id && !n.leida_en ? { ...n, leida_en: ahora } : n) }
      : s);
    await supabase.from('notificacion').update({ leida_en: ahora }).eq('id', id).is('leida_en', null);
  }, []);

  // Marca todas como leídas.
  const marcarTodas = useCallback(async () => {
    if (!clienteId) return;
    const ahora = new Date().toISOString();
    setState(s => s.status === 'listo'
      ? { ...s, notificaciones: s.notificaciones.map(n => n.leida_en ? n : { ...n, leida_en: ahora }) }
      : s);
    await supabase.from('notificacion').update({ leida_en: ahora }).eq('cliente_id', clienteId).is('leida_en', null);
  }, [clienteId]);

  // Elimina una notificación.
  const eliminar = useCallback(async (id: string) => {
    setState(s => s.status === 'listo'
      ? { ...s, notificaciones: s.notificaciones.filter(n => n.id !== id) }
      : s);
    await supabase.from('notificacion').delete().eq('id', id);
  }, []);

  return { state, marcarLeida, marcarTodas, eliminar, recargar: cargar };
}
