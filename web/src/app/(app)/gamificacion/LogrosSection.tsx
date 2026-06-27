'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Logro { id: string; nombre: string; descripcion: string | null }

export function LogrosSection({
  negocioId,
  globales,
  inicial,
}: {
  negocioId: string;
  globales: Logro[];
  inicial: Logro[];
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Logro[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('logro')
      .insert({ negocio_id: negocioId, ambito: 'negocio', nombre, descripcion: descripcion || null })
      .select('id, nombre, descripcion')
      .single();
    if (data) { setLista([data as Logro, ...lista]); setNombre(''); setDescripcion(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('logro').delete().eq('id', id);
    setLista(lista.filter(l => l.id !== id));
  }

  return (
    <Card>
      <h3 className="mb-3 font-medium text-gray-900">Logros e insignias</h3>

      <div className="mb-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Insignias por defecto (activas)</div>
        <div className="flex flex-wrap gap-2">
          {globales.map(l => (
            <span key={l.id} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700" title={l.descripcion ?? ''}>
              {l.nombre}
            </span>
          ))}
        </div>
      </div>

      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Insignias propias del negocio</div>
      <form onSubmit={crear} className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
        <Field label="Nombre"><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Cliente fundador" required /></Field>
        <Field label="Descripción"><Input value={descripcion} onChange={e => setDescripcion(e.target.value)} /></Field>
        <Button type="submit" variant="secondary">Agregar insignia</Button>
      </form>
      {lista.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100">
          {lista.map(l => (
            <li key={l.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-800">{l.nombre}</span>
              <button onClick={() => eliminar(l.id)} className="text-red-600 hover:underline">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
