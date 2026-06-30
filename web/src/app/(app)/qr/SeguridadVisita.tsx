'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type Modo = 'abierto' | 'codigo';

const OPCIONES: { valor: Modo; titulo: string; desc: string }[] = [
  {
    valor: 'abierto',
    titulo: 'Abierto',
    desc: 'El cliente escanea y listo. Ideal si el QR no está a la vista del público.',
  },
  {
    valor: 'codigo',
    titulo: 'Con código',
    desc: 'El cliente escanea y teclea un código de un solo uso que da tu personal. Evita que registren visita sin consumir (QR en mesas).',
  },
];

export function SeguridadVisita({ negocioId, inicial }: { negocioId: string; inicial: Modo }) {
  const supabase = createClient();
  const [modo, setModo] = useState<Modo>(inicial);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(nuevo: Modo) {
    setModo(nuevo);
    setGuardando(true);
    await supabase.from('negocio').update({ seguridad_visita: nuevo }).eq('id', negocioId);
    setGuardando(false);
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Seguridad de visita</h3>
        {guardando && <span className="text-xs text-gray-400">Guardando…</span>}
      </div>
      <p className="mb-3 text-sm text-gray-500">Cómo se valida que un cliente realmente visitó tu negocio.</p>

      <div className="space-y-2">
        {OPCIONES.map(o => {
          const activo = modo === o.valor;
          return (
            <button
              key={o.valor}
              onClick={() => cambiar(o.valor)}
              className={`block w-full rounded-lg border p-3 text-left transition ${
                activo ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded-full border-2 ${activo ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`} />
                <span className="font-medium text-gray-900">{o.titulo}</span>
              </div>
              <p className="mt-1 pl-6 text-sm text-gray-500">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
