/** Parámetros del stack del consumidor (tabs + pantallas push). */
export type ConsumidorStackParams = {
  Tabs: undefined;
  DetalleNegocio: { negocioId: string; nombre: string };
  Insignias: undefined;
  Notificaciones: undefined;
  Referidos: undefined;
  EditarPerfil: undefined;
  Ruleta: { negocioId: string; nombre: string };
  Rasca: { negocioId: string; nombre: string };
  Retos: { negocioId: string; nombre: string };
  Rifas: { negocioId: string; nombre: string };
  Recompensas: { negocioId: string; nombre: string };
  Resena: { negocioId: string; nombre: string };
  Cita: { negocioId: string; nombre: string; modo: 'solicitud' | 'agenda' };
};
