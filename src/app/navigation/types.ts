/** Parámetros del stack del consumidor (tabs + pantallas push). */
export type ConsumidorStackParams = {
  Tabs: undefined;
  DetalleNegocio: { negocioId: string; nombre: string };
  Insignias: undefined;
  Resena: { canjeId: string; negocioId: string; nombre: string };
};
