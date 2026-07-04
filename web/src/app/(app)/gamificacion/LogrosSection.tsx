'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, SectionTitle } from '@/components/ui/Card';

interface Cond { tipo?: string; valor?: string }
interface Logro { id: string; nombre: string; descripcion: string | null; condicion?: Cond }

const CONDS = [
  { v: '', label: 'Manual (yo la asigno)', unidad: '' },
  { v: 'visitas_totales', label: 'Al llegar a X visitas', unidad: 'visitas' },
  { v: 'monto_total', label: 'Al gastar $Y', unidad: 'pesos' },
  { v: 'racha_dias', label: 'Racha de N días', unidad: 'días' },
  { v: 'referidos_completados', label: 'Al invitar a N amigos', unidad: 'amigos' },
] as const;

const condTexto = (c?: Cond) => {
  if (!c?.tipo) return 'manual';
  const d = CONDS.find(x => x.v === c.tipo);
  return `auto: ${c.valor} ${d?.unidad ?? ''}`.trim();
};

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
  const [condTipo, setCondTipo] = useState('');
  const [condValor, setCondValor] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edNombre, setEdNombre] = useState('');
  const [edDesc, setEdDesc] = useState('');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const condicion = condTipo ? { tipo: condTipo, valor: condValor } : {};
    const { data } = await supabase
      .from('logro')
      .insert({ negocio_id: negocioId, ambito: 'negocio', nombre, descripcion: descripcion || null, condicion })
      .select('id, nombre, descripcion, condicion')
      .single();
    if (data) { setLista([data as Logro, ...lista]); setNombre(''); setDescripcion(''); setCondTipo(''); setCondValor(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('logro').delete().eq('id', id);
    setLista(lista.filter(l => l.id !== id));
  }

  function abrirEdicion(l: Logro) {
    setEditandoId(l.id);
    setEdNombre(l.nombre);
    setEdDesc(l.descripcion ?? '');
  }
  async function guardarEdicion(id: string) {
    if (!edNombre.trim()) return;
    const { data } = await supabase
      .from('logro')
      .update({ nombre: edNombre, descripcion: edDesc || null })
      .eq('id', id)
      .select('id, nombre, descripcion')
      .single();
    if (data) {
      setLista(lista.map(l => (l.id === id ? (data as Logro) : l)));
      setEditandoId(null);
    }
  }

  return (
    <Card>
      <SectionTitle icon="🏅" title="Logros e insignias" subtitle="Se ganan solas por condición, o las das a mano desde el CRM" accent="amber" />

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
      <form onSubmit={crear} className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <Field label="Nombre"><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Cliente fundador" required /></Field>
        <Field label="Descripción"><Input value={descripcion} onChange={e => setDescripcion(e.target.value)} /></Field>
        <Field label="¿Cómo se gana?">
          <Select value={condTipo} onChange={e => setCondTipo(e.target.value)}>
            {CONDS.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
          </Select>
        </Field>
        {condTipo ? (
          <Field label={`Valor (${CONDS.find(c => c.v === condTipo)?.unidad})`}>
            <Input type="number" min={1} value={condValor} onChange={e => setCondValor(e.target.value)} required />
          </Field>
        ) : (
          <Button type="submit" variant="secondary">Agregar insignia</Button>
        )}
        {condTipo && (
          <div className="md:col-span-4">
            <Button type="submit" variant="secondary">Agregar insignia</Button>
          </div>
        )}
      </form>
      {lista.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100">
          {lista.map(l => (
            <li key={l.id} className="py-2 text-sm">
              {editandoId === l.id ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-end">
                  <Field label="Nombre"><Input value={edNombre} onChange={e => setEdNombre(e.target.value)} /></Field>
                  <Field label="Descripción"><Input value={edDesc} onChange={e => setEdDesc(e.target.value)} /></Field>
                  <div className="flex items-center gap-3 pb-2">
                    <button onClick={() => guardarEdicion(l.id)} className="text-indigo-600 hover:underline">Guardar</button>
                    <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:underline">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-800">{l.nombre}</span>
                    {l.descripcion && <span className="ml-2 text-gray-400">· {l.descripcion}</span>}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${l.condicion?.tipo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{condTexto(l.condicion)}</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <button onClick={() => abrirEdicion(l)} className="mr-3 text-gray-700 hover:underline">Editar</button>
                    <button onClick={() => eliminar(l.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
