import { Result } from '../../core/result/Result';
import { ProgresoNegocio } from '../entities/ProgresoNegocio';

/**
 * Frontera del dominio hacia los datos. El dominio depende de esta
 * interfaz, no de Supabase. Permite intercambiar implementación real
 * por mock o por tests sin tocar casos de uso ni UI.
 */
export interface NegocioRepository {
  /** Negocios donde el cliente está registrado, con su progreso. */
  obtenerMisNegocios(clienteId: string): Promise<Result<ProgresoNegocio[]>>;
}
