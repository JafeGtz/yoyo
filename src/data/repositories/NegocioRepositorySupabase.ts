import { Result } from '../../core/result/Result';
import { ProgresoNegocio } from '../../domain/entities/ProgresoNegocio';
import { NegocioRepository } from '../../domain/repositories/NegocioRepository';

/**
 * Implementación real contra Supabase. Stub por ahora.
 *
 * Para cablearla (Épica 0 / F0-1, F0-2):
 *   1. npm install @supabase/supabase-js react-native-url-polyfill \
 *                  @react-native-async-storage/async-storage
 *   2. Crear src/data/supabase/supabaseClient.ts (createClient con env).
 *   3. Implementar la consulta debajo (SELECT con JOIN, protegido por RLS
 *      sobre negocio_id) y mapear filas -> ProgresoNegocio.
 *   4. En src/core/config/env.ts poner useMockData = false.
 *
 * El contenedor DI (core/di/container.ts) ya elige esta clase cuando
 * useMockData es false, así que no hay que tocar dominio ni UI.
 */
export class NegocioRepositorySupabase implements NegocioRepository {
  async obtenerMisNegocios(
    _clienteId: string,
  ): Promise<Result<ProgresoNegocio[]>> {
    // TODO: SELECT desde cliente_negocio JOIN negocio (RLS por negocio_id),
    // calcular visitasParaProximoBeneficio según los beneficios activos.
    throw new AppErrorNotImplemented();
  }
}

class AppErrorNotImplemented extends Error {
  constructor() {
    super('NegocioRepositorySupabase aún no está implementado.');
    this.name = 'NotImplemented';
  }
}
