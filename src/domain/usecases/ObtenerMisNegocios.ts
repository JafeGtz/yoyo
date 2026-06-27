import { Result } from '../../core/result/Result';
import { ProgresoNegocio } from '../entities/ProgresoNegocio';
import { NegocioRepository } from '../repositories/NegocioRepository';

/**
 * Caso de uso: obtener los negocios del cliente con su progreso.
 * Hoy solo delega; aquí vivirá la lógica de negocio (ordenar por
 * cercanía a beneficio, filtrar inactivos, etc.) sin tocar la UI.
 */
export class ObtenerMisNegocios {
  constructor(private readonly repo: NegocioRepository) {}

  execute(clienteId: string): Promise<Result<ProgresoNegocio[]>> {
    return this.repo.obtenerMisNegocios(clienteId);
  }
}
