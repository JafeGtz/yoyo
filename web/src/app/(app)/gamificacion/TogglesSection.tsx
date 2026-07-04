'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, SectionTitle } from '@/components/ui/Card';

const OPCIONES: [string, string][] = [
  ['leaderboard', 'Leaderboard (top del mes por negocio)'],
  ['cliente_del_mes', 'Cliente del mes'],
  ['ruleta', 'Ruleta "Gira y Gana"'],
  ['rasca', 'Rasca y gana'],
];

export function TogglesSection({ negocioId, config }: { negocioId: string; config: Record<string, boolean> }) {
  const supabase = createClient();
  const [estado, setEstado] = useState<Record<string, boolean>>(config);

  async function toggle(k: string) {
    const nuevo = { ...estado, [k]: !estado[k] };
    setEstado(nuevo);
    await supabase.from('negocio').update({ config: nuevo }).eq('id', negocioId);
  }

  return (
    <Card>
      <SectionTitle icon="🎛️" title="Funciones activas" subtitle="Enciende o apaga cada mecánica" accent="indigo" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {OPCIONES.map(([k, l]) => {
          const on = !!estado[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm transition ${
                on ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{l}</span>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
