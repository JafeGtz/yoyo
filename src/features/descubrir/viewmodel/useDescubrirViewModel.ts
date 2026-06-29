import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface NegocioDir {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string | null;
  logo_url: string | null;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; negocios: NegocioDir[] };

export function useDescubrirViewModel() {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    setState({ status: 'cargando' });
    const { data, error } = await supabase
      .from('negocio')
      .select('id, nombre, tipo, direccion, logo_url')
      .eq('estado', 'activo')
      .order('nombre');
    if (error) setState({ status: 'error', mensaje: error.message });
    else setState({ status: 'listo', negocios: (data as NegocioDir[]) ?? [] });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state };
}
