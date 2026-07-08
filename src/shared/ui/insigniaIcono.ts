import type { IconName } from './Icon';

// Mapea el 'icono' guardado en la tabla logro a un icono propio.
const MAP: Record<string, IconName> = {
  sparkle: 'sparkles', sparkles: 'sparkles', medal: 'medal', trophy: 'trophy',
  sunrise: 'sunrise', moon: 'moon', users: 'users', cake: 'cake', compass: 'compass',
  flame: 'flame', crown: 'crown', star: 'star', ticket: 'ticket', heart: 'heart',
  chart: 'chart', map: 'map', bag: 'bag', target: 'target', gift: 'gift', coin: 'coin',
  calendar: 'calendar', dice: 'dice',
};

export const iconoDeLogro = (icono: string | null): IconName => (icono && MAP[icono]) || 'medal';
