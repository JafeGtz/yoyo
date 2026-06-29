/** Parámetros del stack del consumidor (tabs + pantallas push). */
export type ConsumidorStackParams = {
  Tabs: undefined;
  DetalleNegocio: { negocioId: string; nombre: string };
  Resena: { canjeId: string; negocioId: string; nombre: string };
};
