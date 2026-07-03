'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Rifa { id: string; nombre: string; premio: string | null; cierra_en: string | null; estado: string; ganador?: string }
interface BeneficioOpcion { id: string; nombre: string }

export function RifasSection({ negocioId, inicial, beneficios }: { negocioId: string; inicial: Rifa[]; beneficios: BeneficioOpcion[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<Rifa[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [premio, setPremio] = useState('');
  const [benId, setBenId] = useState('');
  const [minVisitas, setMinVisitas] = useState('0');
  const [cierra, setCierra] = useState('');
  const [sorteandoId, setSorteandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('rifa')
      .insert({
        negocio_id: negocioId, nombre, premio: premio || null,
        beneficio_id: benId || null,
        criterio: { min_visitas: Number(minVisitas) || 0 },
        cierra_en: cierra || null,
      })
      .select('id, nombre, premio, cierra_en, estado')
      .single();
    if (data) { setLista([data as Rifa, ...lista]); setNombre(''); setPremio(''); setBenId(''); setMinVisitas('0'); setCierra(''); }
  }

  async function sortear(r: Rifa) {
    setSorteandoId(r.id);
    setError(null);
    const { data, error } = await supabase.rpc('sortear_rifa', { p_rifa_id: r.id });
    if (error) setError('Error: ' + error.message);
    else setLista(lista.map(x => (x.id === r.id ? { ...x, estado: 'sorteada', ganador: data as string } : x)));
    setSorteandoId(null);
  }

  async function eliminar(id: string) {
    await supabase.from('rifa').delete().eq('id', id);
    setLista(lista.filter(r => r.id !== id));
  }

  return (
    <Card>
      <h3 className="mb-1 font-medium text-gray-900">Rifas</h3>
      <p className="mb-3 text-sm text-gray-500">Al sortear, el ganador recibe el beneficio en su app (si eliges uno) y lo verás aquí.</p>
      <form onSubmit={crear} className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
        <Field label="Nombre"><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Rifa de septiembre" required /></Field>
        <Field label="Premio (texto)"><Input value={premio} onChange={e => setPremio(e.target.value)} placeholder="Pantalla, cena…" /></Field>
        <Field label="Beneficio que entrega">
          <Select value={benId} onChange={e => setBenId(e.target.value)}>
            <option value="">Ninguno (solo texto)</option>
            {beneficios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Participan desde (visitas)"><Input type="number" min={0} value={minVisitas} onChange={e => setMinVisitas(e.target.value)} /></Field>
        <Button type="submit" variant="secondary">Agregar rifa</Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {lista.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {lista.map(r => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-800">
                {r.nombre} {r.premio && <span className="text-gray-400">— {r.premio}</span>}
                {r.estado === 'sorteada' && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Ganador: {r.ganador ?? '✓'}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3">
                {r.estado !== 'sorteada' && (
                  <button onClick={() => sortear(r)} disabled={sorteandoId === r.id} className="text-indigo-600 hover:underline">
                    {sorteandoId === r.id ? 'Sorteando…' : 'Sortear'}
                  </button>
                )}
                <button onClick={() => eliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
