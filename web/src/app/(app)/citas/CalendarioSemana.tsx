'use client';

import { useState } from 'react';
import type { Cita } from './CitasClient';
import { ZONA_NEGOCIO, partesEnZona } from '@/lib/zona';

const COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  confirmada: 'bg-green-100 border-green-400 text-green-900',
  completada: 'bg-gray-100 border-gray-300 text-gray-500',
  cancelada: 'bg-red-50 border-red-300 text-red-600 line-through',
};

const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const H_INI = 7;   // muestra de 7:00
const H_FIN = 21;  // a 21:00
const PX_HORA = 52;

// Las fechas de calendario se manejan como Date a medianoche UTC: las usamos solo
// como "portadoras" de (año, mes, día) sin que la zona del navegador las altere.
function hoyEnZonaNegocio(): Date {
  const p = partesEnZona(new Date().toISOString(), ZONA_NEGOCIO);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}
function lunesDe(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getUTCDay() + 6) % 7; // lunes = 0
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}
function masDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function ymd(d: Date) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function CalendarioSemana({ citas }: { citas: Cita[] }) {
  const [ancla, setAncla] = useState(() => lunesDe(hoyEnZonaNegocio()));
  const hoy = hoyEnZonaNegocio();

  const dias = Array.from({ length: 7 }, (_, i) => masDias(ancla, i));
  const horas = Array.from({ length: H_FIN - H_INI }, (_, i) => H_INI + i);

  // Pre-calcula las partes de cada cita en la zona del negocio una sola vez.
  const citasZona = citas.map(c => ({ cita: c, z: partesEnZona(c.inicia_en, ZONA_NEGOCIO) }));

  function mover(n: number) {
    setAncla(masDias(ancla, n));
  }

  const rango = `${dias[0].getUTCDate()} ${MES_CORTO[dias[0].getUTCMonth()]} – ${dias[6].getUTCDate()} ${MES_CORTO[dias[6].getUTCMonth()]}`;
  const cols = { gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Navegación */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button onClick={() => mover(-7)} className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50">←</button>
        <button onClick={() => mover(7)} className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50">→</button>
        <button onClick={() => setAncla(lunesDe(hoyEnZonaNegocio()))} className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Hoy</button>
        <span className="ml-2 text-sm font-medium text-gray-900">{rango}</span>
        <span className="ml-auto text-xs text-gray-400">Horario de {ZONA_NEGOCIO.split('/')[1].replace('_', ' ')}</span>
      </div>

      {/* Encabezado de días */}
      <div className="grid border-b border-gray-100" style={cols}>
        <div />
        {dias.map((d, i) => {
          const esHoy = d.getTime() === hoy.getTime();
          return (
            <div key={i} className={`border-l border-gray-100 py-2 text-center text-xs ${esHoy ? 'bg-indigo-50' : ''}`}>
              <div className="text-gray-500">{NOMBRE_DIA[i]}</div>
              <div className={`text-sm font-semibold ${esHoy ? 'text-indigo-600' : 'text-gray-800'}`}>{d.getUTCDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Rejilla horaria */}
      <div className="grid overflow-x-auto" style={cols}>
        {/* Columna de horas */}
        <div>
          {horas.map(h => (
            <div key={h} className="relative" style={{ height: PX_HORA }}>
              <span className="absolute -top-2 right-1 text-[10px] text-gray-400">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        {dias.map((d, i) => {
          const dd = ymd(d);
          return (
            <div key={i} className="relative border-l border-gray-100" style={{ height: horas.length * PX_HORA }}>
              {horas.map((h, hi) => (
                <div key={h} className="absolute inset-x-0 border-t border-gray-50" style={{ top: hi * PX_HORA }} />
              ))}
              {citasZona
                .filter(({ z }) => z.year === dd.year && z.month === dd.month && z.day === dd.day)
                .map(({ cita: c, z }) => {
                  const mins = (z.hour - H_INI) * 60 + z.minute;
                  const top = Math.max(0, (mins / 60) * PX_HORA);
                  const alto = Math.max((c.duracion_min / 60) * PX_HORA - 2, 16);
                  const hhmm = `${String(z.hour).padStart(2, '0')}:${String(z.minute).padStart(2, '0')}`;
                  return (
                    <div
                      key={c.id}
                      title={`${hhmm} · ${c.cliente?.nombre ?? ''} · ${c.servicio ?? ''} (${c.estado})`}
                      className={`absolute inset-x-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight ${COLOR[c.estado]}`}
                      style={{ top, height: alto }}
                    >
                      <div className="truncate font-medium">{hhmm} {c.cliente?.nombre ?? ''}</div>
                      {c.servicio && <div className="truncate">{c.servicio}</div>}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
