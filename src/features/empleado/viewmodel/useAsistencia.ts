import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

interface Abierta { id: string; entrada: string }

/** Asistencia del empleado: detecta si tiene una entrada abierta hoy y permite
 *  marcar entrada/salida. */
export function useAsistencia(usuarioNegocioId?: string, negocioId?: string) {
  const [abierta, setAbierta] = useState<Abierta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuarioNegocioId) { setCargando(false); return; }
    setCargando(true);
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const { data } = await supabase.from('asistencia')
      .select('id, entrada')
      .eq('usuario_negocio_id', usuarioNegocioId)
      .is('salida', null)
      .gte('entrada', inicioDia.toISOString())
      .order('entrada', { ascending: false })
      .limit(1)
      .maybeSingle();
    setAbierta(data ? (data as Abierta) : null);
    setCargando(false);
  }, [usuarioNegocioId]);

  useEffect(() => { cargar(); }, [cargar]);

  const marcar = useCallback(async () => {
    if (!usuarioNegocioId || !negocioId || guardando) return;
    setGuardando(true);
    if (abierta) {
      await supabase.from('asistencia').update({ salida: new Date().toISOString() }).eq('id', abierta.id);
      setAbierta(null);
    } else {
      const { data } = await supabase.from('asistencia')
        .insert({ negocio_id: negocioId, usuario_negocio_id: usuarioNegocioId })
        .select('id, entrada')
        .single();
      if (data) setAbierta(data as Abierta);
    }
    setGuardando(false);
  }, [abierta, usuarioNegocioId, negocioId, guardando]);

  return { abierta, cargando, guardando, marcar };
}
