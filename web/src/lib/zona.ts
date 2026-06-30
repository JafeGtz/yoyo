// Manejo de zona horaria del negocio.
// Todo se guarda como instante absoluto (timestamptz). Al MOSTRAR o CONSTRUIR
// horas usamos siempre la zona del negocio, nunca la del navegador que mira,
// para evitar desfaces (ej. lunes 23:00 que aparece como martes).

export const ZONA_NEGOCIO = 'America/Mexico_City';

/** Partes de calendario (año/mes/día/hora/min) de un instante, en la zona dada. */
export function partesEnZona(iso: string, tz: string = ZONA_NEGOCIO) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => partes.find(p => p.type === t)!.value;
  const hora = g('hour') === '24' ? 0 : Number(g('hour')); // Intl puede dar "24" a medianoche
  return { year: Number(g('year')), month: Number(g('month')), day: Number(g('day')), hour: hora, minute: Number(g('minute')) };
}

/** "14:30" en la zona del negocio. */
export function horaEnZona(iso: string, tz: string = ZONA_NEGOCIO) {
  return new Date(iso).toLocaleTimeString('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
}

/** "1 jul 2026, 14:30" en la zona del negocio. */
export function fechaHoraEnZona(iso: string, tz: string = ZONA_NEGOCIO) {
  return new Date(iso).toLocaleString('es-MX', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Convierte un "wall clock" (lo que el dueño escribe en <input datetime-local>,
 * sin zona) al instante UTC correcto interpretándolo EN la zona del negocio.
 * Ej: "2026-07-01T23:00" en CDMX -> "2026-07-02T05:00:00.000Z".
 */
export function instanteDesdeWallClock(wall: string, tz: string = ZONA_NEGOCIO): string {
  const [fecha, hora] = wall.split('T');
  const [Y, M, D] = fecha.split('-').map(Number);
  const [h, m] = hora.split(':').map(Number);
  const guess = Date.UTC(Y, M - 1, D, h, m); // suponemos UTC y corregimos por el offset real
  const p = partesEnZona(new Date(guess).toISOString(), tz);
  const comoTz = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offset = comoTz - guess; // ms que la zona va adelantada respecto a UTC
  return new Date(guess - offset).toISOString();
}
