import { supabase } from '../supabase/supabaseClient';

/** Huecos libres de un negocio en una fecha (YYYY-MM-DD). Modo agenda. */
export async function slotsDisponibles(negocioId: string, fecha: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('slots_disponibles', {
    p_negocio_id: negocioId,
    p_fecha: fecha,
  });
  if (error) throw new Error(error.message);
  return (data as string[]) ?? [];
}

/** Reserva un hueco (modo agenda). Devuelve el id de la cita. */
export async function agendarCita(
  negocioId: string,
  iniciaEn: string,
  servicio: string,
  duracionMin: number,
): Promise<string> {
  const { data, error } = await supabase.rpc('agendar_cita', {
    p_negocio_id: negocioId,
    p_inicia_en: iniciaEn,
    p_servicio: servicio || null,
    p_duracion: duracionMin,
  });
  if (error) {
    if (error.message.includes('slot_ocupado')) throw new Error('Ese horario se acaba de ocupar. Elige otro.');
    throw new Error(error.message);
  }
  return data as string;
}

/** Envía una solicitud de cita (modo solicitud). Queda pendiente de confirmación del dueño. */
export async function solicitarCita(
  negocioId: string,
  clienteId: string,
  servicio: string,
  iniciaEn: string,
  duracionMin: number,
): Promise<void> {
  const { error } = await supabase.from('cita').insert({
    negocio_id: negocioId,
    cliente_id: clienteId,
    servicio: servicio || null,
    inicia_en: iniciaEn,
    duracion_min: duracionMin,
    estado: 'pendiente',
  });
  if (error) throw new Error(error.message);
}
