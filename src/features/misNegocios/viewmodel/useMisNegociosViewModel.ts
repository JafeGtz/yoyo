import { useCallback, useEffect, useState } from 'react';
import { container } from '../../../core/di/container';
import { ProgresoNegocio } from '../../../domain/entities/ProgresoNegocio';

/** Estado de UI que el ViewModel expone a la View (View es "tonta"). */
export type MisNegociosUiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; negocios: ProgresoNegocio[] };

/**
 * ViewModel (MVVM): orquesta el caso de uso y traduce el resultado a un
 * estado de UI. No contiene JSX ni conoce componentes; la View solo lee
 * `state` y llama `recargar`.
 */
export function useMisNegociosViewModel(clienteId: string) {
  const [state, setState] = useState<MisNegociosUiState>({
    status: 'cargando',
  });

  const cargar = useCallback(async () => {
    setState({ status: 'cargando' });
    const result =
      await container.usecases.obtenerMisNegocios.execute(clienteId);
    if (result.ok) {
      setState({ status: 'listo', negocios: result.value });
    } else {
      setState({ status: 'error', mensaje: result.error.message });
    }
  }, [clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state, recargar: cargar };
}
