'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

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
      <h3 className="mb-3 font-medium text-gray-900">Funciones activas</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPCIONES.map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!estado[k]} onChange={() => toggle(k)} />
            {l}
          </label>
        ))}
      </div>
    </Card>
  );
}
