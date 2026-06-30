// Zona horaria del negocio (igual que en el SaaS). Las horas se muestran y se
// construyen SIEMPRE en esta zona, no en la del dispositivo, para evitar desfaces.

export const ZONA_NEGOCIO = 'America/Mexico_City';

export function partesEnZona(iso: string, tz: string = ZONA_NEGOCIO) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => partes.find(p => p.type === t)!.value;
  const hora = g('hour') === '24' ? 0 : Number(g('hour'));
  return { year: Number(g('year')), month: Number(g('month')), day: Number(g('day')), hour: hora, minute: Number(g('minute')) };
}

/** "14:30" en la zona del negocio. */
export function horaEnZona(iso: string, tz: string = ZONA_NEGOCIO) {
  return new Date(iso).toLocaleTimeString('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
}

/**
 * Instante UTC a partir de un día (Y/M/D) y una hora (h:m) interpretados EN la
 * zona del negocio. Ej: lunes 23:00 CDMX -> el martes 05:00Z correcto.
 */
export function instanteEnZona(year: number, month: number, day: number, h: number, m: number, tz: string = ZONA_NEGOCIO): string {
  const guess = Date.UTC(year, month - 1, day, h, m);
  const p = partesEnZona(new Date(guess).toISOString(), tz);
  const comoTz = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offset = comoTz - guess; // ms que la zona va adelantada respecto a UTC
  return new Date(guess - offset).toISOString();
}
