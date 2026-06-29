import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface Referido {
  estado: string;
  creado_en: string;
  completado_en: string | null;
  referido: { nombre: string } | null;
}

interface Datos {
  codigo: string;
  referidos: Referido[];
  completados: number;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; datos: Datos };

export function useReferidosViewModel(clienteId: string) {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    if (!clienteId) return;
    setState({ status: 'cargando' });

    const [cli, refs] = await Promise.all([
      supabase.from('cliente').select('codigo_referido').eq('id', clienteId).single(),
      supabase.from('referido').select('estado, creado_en, completado_en, referido:referido_cliente_id(nombre)').eq('referidor_cliente_id', clienteId).order('creado_en', { ascending: false }),
    ]);

    if (cli.error) {
      setState({ status: 'error', mensaje: cli.error.message });
      return;
    }

    const referidos = (refs.data as unknown as Referido[]) ?? [];
    setState({
      status: 'listo',
      datos: {
        codigo: cli.data.codigo_referido,
        referidos,
        completados: referidos.filter(r => r.estado === 'completado').length,
      },
    });
  }, [clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state };
}
