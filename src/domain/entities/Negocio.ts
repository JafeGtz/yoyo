/** Modelo de acumulación del negocio (ver requerimientos 3.1). */
export type ModeloAcumulacion = 'basico' | 'plus';

/** Entidad de dominio: negocio adherido a la red. */
export interface Negocio {
  id: string;
  nombre: string;
  tipo: string;
  logoUrl?: string;
  modeloAcumulacion: ModeloAcumulacion;
}
