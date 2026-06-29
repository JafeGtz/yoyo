import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface BeneficioDesbloqueado {
  id: string;
  estado: string;
  vence_en: string | null;
  beneficio: { nombre: string; tipo: string } | null;
  negocio: { nombre: string } | null;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; beneficios: BeneficioDesbloqueado[] };

export function useMisBeneficiosViewModel(clienteId: string) {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    if (!clienteId) {
      setState({ status: 'listo', beneficios: [] });
      return;
    }
    setState({ status: 'cargando' });
    const { data, error } = await supabase
      .from('beneficio_desbloqueado')
      .select('id, estado, vence_en, beneficio:beneficio_id(nombre, tipo), negocio:negocio_id(nombre)')
      .eq('cliente_id', clienteId)
      .order('desbloqueado_en', { ascending: false });
    if (error) setState({ status: 'error', mensaje: error.message });
    else setState({ status: 'listo', beneficios: (data as unknown as BeneficioDesbloqueado[]) ?? [] });
  }, [clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state, recargar: cargar };
}
