'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Reto { id: string; nombre: string; descripcion: string | null; activo: boolean; vence_en: string | null }

export function RetosSection({ negocioId, inicial }: { negocioId: string; inicial: Reto[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<Reto[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [meta, setMeta] = useState('5');
  const [vence, setVence] = useState('');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('reto')
      .insert({
        negocio_id: negocioId, ambito: 'negocio', nombre,
        meta: Number(meta),
        condiciones: { tipo: 'visitas', meta: Number(meta) },
        vence_en: vence || null,
      })
      .select('id, nombre, descripcion, activo, vence_en')
      .single();
    if (data) { setLista([data as Reto, ...lista]); setNombre(''); setMeta('5'); setVence(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('reto').delete().eq('id', id);
    setLista(lista.filter(r => r.id !== id));
  }

  return (
    <Card>
      <h3 className="mb-3 font-medium text-gray-900">Retos y misiones</h3>
      <form onSubmit={crear} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <Field label="Reto"><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Visita seguido este mes" required /></Field>
        <Field label="Meta (visitas)"><Input type="number" min={1} value={meta} onChange={e => setMeta(e.target.value)} required /></Field>
        <Field label="Vence"><Input type="date" value={vence} onChange={e => setVence(e.target.value)} /></Field>
        <Button type="submit" variant="secondary">Agregar reto</Button>
      </form>
      {lista.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {lista.map(r => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-800">{r.nombre}{r.vence_en && <span className="ml-2 text-xs text-gray-400">vence {new Date(r.vence_en).toLocaleDateString('es-MX')}</span>}</span>
              <button onClick={() => eliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
