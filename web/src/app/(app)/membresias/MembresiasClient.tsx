'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export interface Nivel {
  id: string;
  nombre: string;
  visitas_minimas: number;
  orden: number;
  caduca_anual: boolean;
}

interface BeneficioNivel {
  id: string;
  nombre: string;
  nivel_membresia_id: string;
}

export function MembresiasClient({
  negocioId,
  inicial,
  beneficiosPorNivel,
}: {
  negocioId: string;
  inicial: Nivel[];
  beneficiosPorNivel: BeneficioNivel[];
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Nivel[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [visitas, setVisitas] = useState('0');
  const [caduca, setCaduca] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edNombre, setEdNombre] = useState('');
  const [edVisitas, setEdVisitas] = useState('0');
  const [edCaduca, setEdCaduca] = useState(false);

  const beneficiosDe = (nivelId: string) =>
    beneficiosPorNivel.filter(b => b.nivel_membresia_id === nivelId);

  function abrirEdicion(n: Nivel) {
    setEditandoId(n.id);
    setEdNombre(n.nombre);
    setEdVisitas(String(n.visitas_minimas));
    setEdCaduca(n.caduca_anual);
  }
  async function guardarEdicion(id: string) {
    if (!edNombre.trim()) return;
    const { data, error } = await supabase
      .from('nivel_membresia')
      .update({ nombre: edNombre, visitas_minimas: Number(edVisitas), caduca_anual: edCaduca })
      .eq('id', id)
      .select('id, nombre, visitas_minimas, orden, caduca_anual')
      .single();
    if (error) { setError(error.message); return; }
    if (data) {
      setLista(lista.map(x => (x.id === id ? (data as Nivel) : x)).sort((a, b) => a.visitas_minimas - b.visitas_minimas));
      setEditandoId(null);
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const { data, error } = await supabase
      .from('nivel_membresia')
      .insert({
        negocio_id: negocioId,
        nombre,
        visitas_minimas: Number(visitas),
        orden: lista.length,
        caduca_anual: caduca,
      })
      .select('id, nombre, visitas_minimas, orden, caduca_anual')
      .single();
    if (error) setError(error.message);
    else if (data) {
      setLista([...lista, data as Nivel].sort((a, b) => a.visitas_minimas - b.visitas_minimas));
      setNombre('');
      setVisitas('0');
      setCaduca(false);
    }
    setGuardando(false);
  }

  async function eliminar(n: Nivel) {
    await supabase.from('nivel_membresia').delete().eq('id', n.id);
    setLista(lista.filter(x => x.id !== n.id));
  }

  return (
    <div>
      <PageHeader title="Membresías" description="Niveles que tus clientes alcanzan al acumular visitas, con beneficios exclusivos." />

      <Card className="mb-6">
        <form onSubmit={crear} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <Field label="Nombre del nivel">
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Plata, Oro, VIP…" required />
          </Field>
          <Field label="Visitas mínimas">
            <Input type="number" min={0} value={visitas} onChange={e => setVisitas(e.target.value)} required />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={caduca} onChange={e => setCaduca(e.target.checked)} />
            Caduca cada año
          </label>
          <div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar nivel'}</Button>
          </div>
        </form>
      </Card>

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no hay niveles. Crea el primero arriba.</p>
      ) : (
        <div className="space-y-3">
          {lista.map(n => {
            const bens = beneficiosDe(n.id);
            return (
              <Card key={n.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editandoId === n.id ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                        <Field label="Nombre del nivel"><Input value={edNombre} onChange={e => setEdNombre(e.target.value)} /></Field>
                        <Field label="Visitas mínimas"><Input type="number" min={0} value={edVisitas} onChange={e => setEdVisitas(e.target.value)} /></Field>
                        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
                          <input type="checkbox" checked={edCaduca} onChange={e => setEdCaduca(e.target.checked)} />
                          Caduca cada año
                        </label>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{n.nombre}</span>
                          {n.caduca_anual && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              caduca anual
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm text-gray-500">Desde {n.visitas_minimas} visitas</div>
                      </>
                    )}
                    <div className="mt-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Beneficios exclusivos
                      </div>
                      {bens.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-400">
                          Ninguno. Asígnalos desde la pantalla de Beneficios.
                        </p>
                      ) : (
                        <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
                          {bens.map(b => <li key={b.id}>{b.nombre}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 whitespace-nowrap">
                    {editandoId === n.id ? (
                      <>
                        <button onClick={() => guardarEdicion(n.id)} className="mr-3 text-sm text-indigo-600 hover:underline">Guardar</button>
                        <button onClick={() => setEditandoId(null)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => abrirEdicion(n)} className="mr-3 text-sm text-gray-700 hover:underline">Editar</button>
                        <button onClick={() => eliminar(n)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
