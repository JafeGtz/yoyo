import { Negocio } from './Negocio';

/**
 * Progreso del cliente en un negocio (relación Cliente-Negocio + resumen
 * del próximo beneficio). Es lo que ve el cliente en "Mis negocios".
 */
export interface ProgresoNegocio {
  negocio: Negocio;
  visitasTotales: number;
  nivelActual: string;
  /** Visitas que faltan para el próximo beneficio, si hay uno próximo. */
  visitasParaProximoBeneficio?: number;
  proximoBeneficio?: string;
}
