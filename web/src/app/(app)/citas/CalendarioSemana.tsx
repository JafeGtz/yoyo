'use client';

import { useState } from 'react';
import type { Cita } from './CitasClient';

const COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  confirmada: 'bg-green-100 border-green-400 text-green-900',
  completada: 'bg-gray-100 border-gray-300 text-gray-500',
  cancelada: 'bg-red-50 border-red-300 text-red-600 line-through',
};

const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const H_INI = 7;   // muestra de 7:00
const H_FIN = 21;  // a 21:00
const PX_HORA = 52;

function lunesDe(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarioSemana({ citas }: { citas: Cita[] }) {
  const [ancla, setAncla] = useState(() => lunesDe(new Date()));
  const hoy = new Date();

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ancla);
    d.setDate(d.getDate() + i);
    return d;
  });
  const horas = Array.from({ length: H_FIN - H_INI }, (_, i) => H_INI + i);
  const finSemana = new Date(ancla);
  finSemana.setDate(finSemana.getDate() + 7);

  const visibles = citas.filter(c => {
    const t = new Date(c.inicia_en);
    return t >= ancla && t < finSemana;
  });

  function mover(dias: number) {
    const n = new Date(ancla);
    n.setDate(n.getDate() + dias);
    setAncla(n);
  }

  const rango = `${ancla.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${dias[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
  const cols = { gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Navegación */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button onClick={() => mover(-7)} className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50">←</button>
        <button onClick={() => mover(7)} className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50">→</button>
        <button onClick={() => setAncla(lunesDe(new Date()))} className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Hoy</button>
        <span className="ml-2 text-sm font-medium text-gray-900">{rango}</span>
      </div>

      {/* Encabezado de días */}
      <div className="grid border-b border-gray-100" style={cols}>
        <div />
        {dias.map((d, i) => {
          const esHoy = mismoDia(d, hoy);
          return (
            <div key={i} className={`border-l border-gray-100 py-2 text-center text-xs ${esHoy ? 'bg-indigo-50' : ''}`}>
              <div className="text-gray-500">{NOMBRE_DIA[i]}</div>
              <div className={`text-sm font-semibold ${esHoy ? 'text-indigo-600' : 'text-gray-800'}`}>{d.getDate()}</div>
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
        {dias.map((d, i) => (
          <div key={i} className="relative border-l border-gray-100" style={{ height: horas.length * PX_HORA }}>
            {horas.map((h, hi) => (
              <div key={h} className="absolute inset-x-0 border-t border-gray-50" style={{ top: hi * PX_HORA }} />
            ))}
            {visibles.filter(c => mismoDia(new Date(c.inicia_en), d)).map(c => {
              const t = new Date(c.inicia_en);
              const mins = (t.getHours() - H_INI) * 60 + t.getMinutes();
              const top = Math.max(0, (mins / 60) * PX_HORA);
              const alto = Math.max((c.duracion_min / 60) * PX_HORA - 2, 16);
              return (
                <div
                  key={c.id}
                  title={`${t.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} · ${c.cliente?.nombre ?? ''} · ${c.servicio ?? ''} (${c.estado})`}
                  className={`absolute inset-x-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight ${COLOR[c.estado]}`}
                  style={{ top, height: alto }}
                >
                  <div className="truncate font-medium">
                    {t.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} {c.cliente?.nombre ?? ''}
                  </div>
                  {c.servicio && <div className="truncate">{c.servicio}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
