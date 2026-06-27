import { ok, Result } from '../../core/result/Result';
import { ProgresoNegocio } from '../../domain/entities/ProgresoNegocio';
import { NegocioRepository } from '../../domain/repositories/NegocioRepository';

const DATA: ProgresoNegocio[] = [
  {
    negocio: {
      id: 'n1',
      nombre: 'Barbería El Corte',
      tipo: 'Barbería',
      modeloAcumulacion: 'basico',
    },
    visitasTotales: 7,
    nivelActual: 'Plata',
    visitasParaProximoBeneficio: 3,
    proximoBeneficio: 'Corte gratis',
  },
  {
    negocio: {
      id: 'n2',
      nombre: 'Café Aroma',
      tipo: 'Cafetería',
      modeloAcumulacion: 'basico',
    },
    visitasTotales: 12,
    nivelActual: 'Oro',
    visitasParaProximoBeneficio: 1,
    proximoBeneficio: 'Café americano gratis',
  },
  {
    negocio: {
      id: 'n3',
      nombre: 'Lavado Express',
      tipo: 'Lavado de autos',
      modeloAcumulacion: 'plus',
    },
    visitasTotales: 4,
    nivelActual: 'Bronce',
  },
];

/** Implementación en memoria para desarrollo y tests, sin backend. */
export class NegocioRepositoryMock implements NegocioRepository {
  async obtenerMisNegocios(
    _clienteId: string,
  ): Promise<Result<ProgresoNegocio[]>> {
    await new Promise(resolve => setTimeout(resolve, 400)); // simula latencia
    return ok(DATA);
  }
}
