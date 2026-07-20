'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export type Criterio = 'visitas' | 'monto';

export interface Nivel {
  id: string;
  nombre: string;
  visitas_minimas: number;
  monto_minimo: number;
  orden: number;
  caduca_anual: boolean;
}

interface BeneficioNivel {
  id: string;
  nombre: string;
  nivel_membresia_id: string;
}

const SELECT = 'id, nombre, visitas_minimas, monto_minimo, orden, caduca_anual';

export function MembresiasClient({
  negocioId,
  inicial,
  beneficiosPorNivel,
  criterioInicial,
  diasBajaInicial,
}: {
  negocioId: string;
  inicial: Nivel[];
  beneficiosPorNivel: BeneficioNivel[];
  criterioInicial: Criterio;
  diasBajaInicial: number;
}) {
  const supabase = createClient();
  const [criterio, setCriterio] = useState<Criterio>(criterioInicial);
  const [diasBaja, setDiasBaja] = useState(String(diasBajaInicial ?? 0));
  const [diasMsg, setDiasMsg] = useState('');
  const [lista, setLista] = useState<Nivel[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [umbral, setUmbral] = useState('0');
  const [caduca, setCaduca] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edNombre, setEdNombre] = useState('');
  const [edUmbral, setEdUmbral] = useState('0');
  const [edCaduca, setEdCaduca] = useState(false);

  const esMonto = criterio === 'monto';
  const umbralLabel = esMonto ? 'Monto mínimo ($)' : 'Visitas mínimas';
  const umbralDe = (n: Nivel) => (esMonto ? n.monto_minimo : n.visitas_minimas);
  const ordenar = (arr: Nivel[]) => [...arr].sort((a, b) => umbralDe(a) - umbralDe(b));

  const beneficiosDe = (nivelId: string) =>
    beneficiosPorNivel.filter(b => b.nivel_membresia_id === nivelId);

  // Re-clasifica a todos los clientes tras un cambio (Hueco 3).
  async function recalcular() {
    await supabase.rpc('recalcular_niveles', { p_negocio_id: negocioId });
  }

  async function cambiarCriterio(nuevo: Criterio) {
    if (nuevo === criterio) return;
    setCriterio(nuevo);
    await supabase.from('negocio').update({ nivel_criterio: nuevo }).eq('id', negocioId);
    await recalcular();
  }

  async function guardarDiasBaja() {
    const n = parseInt(diasBaja, 10);
    const valor = isNaN(n) || n <= 0 ? null : n;
    await supabase.from('negocio').update({ dias_baja_nivel: valor }).eq('id', negocioId);
    setDiasMsg(valor ? `Guardado: baja un nivel tras ${valor} días sin visitar.` : 'Guardado: el nivel no baja por inactividad.');
  }

  function campoUmbral(nombreCampo: 'nuevo' | 'edit') {
    const value = nombreCampo === 'nuevo' ? umbral : edUmbral;
    const setter = nombreCampo === 'nuevo' ? setUmbral : setEdUmbral;
    return <Input type="number" min={0} value={value} onChange={e => setter(e.target.value)} required />;
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
        visitas_minimas: esMonto ? 0 : Number(umbral),
        monto_minimo: esMonto ? Number(umbral) : 0,
        orden: lista.length,
        caduca_anual: caduca,
      })
      .select(SELECT)
      .single();
    if (error) setError(error.message);
    else if (data) {
      setLista(ordenar([...lista, data as Nivel]));
      setNombre('');
      setUmbral('0');
      setCaduca(false);
      await recalcular();
    }
    setGuardando(false);
  }

  function abrirEdicion(n: Nivel) {
    setEditandoId(n.id);
    setEdNombre(n.nombre);
    setEdUmbral(String(umbralDe(n)));
    setEdCaduca(n.caduca_anual);
  }
  async function guardarEdicion(id: string) {
    if (!edNombre.trim()) return;
    const cambios = esMonto
      ? { nombre: edNombre, monto_minimo: Number(edUmbral), caduca_anual: edCaduca }
      : { nombre: edNombre, visitas_minimas: Number(edUmbral), caduca_anual: edCaduca };
    const { data, error } = await supabase.from('nivel_membresia').update(cambios).eq('id', id).select(SELECT).single();
    if (error) { setError(error.message); return; }
    if (data) {
      setLista(ordenar(lista.map(x => (x.id === id ? (data as Nivel) : x))));
      setEditandoId(null);
      await recalcular();
    }
  }

  async function eliminar(n: Nivel) {
    await supabase.from('nivel_membresia').delete().eq('id', n.id);
    setLista(lista.filter(x => x.id !== n.id));
    await recalcular();
  }

  return (
    <div>
      <PageHeader icon="🏅" title="Membresías" description="Niveles que tus clientes alcanzan automáticamente, con beneficios exclusivos." />

      {/* Criterio del negocio */}
      <Card className="mb-6">
        <h3 className="font-medium text-gray-900">¿Cómo se sube de nivel?</h3>
        <p className="mt-1 mb-3 text-sm text-gray-500">Elige si tus clientes suben por cuántas veces vienen o por cuánto gastan.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([['visitas', 'Por visitas', 'Cuenta cuántas veces viene el cliente.'], ['monto', 'Por monto gastado', 'Suma cuánto ha gastado el cliente.']] as const).map(([v, t, d]) => (
            <button key={v} type="button" onClick={() => cambiarCriterio(v)}
              className={`rounded-xl border p-3 text-left transition ${criterio === v ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-sm font-medium text-gray-900">{t}</div>
              <div className="mt-0.5 text-xs text-gray-500">{d}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="font-medium text-gray-900">¿Baja de nivel por inactividad?</h3>
        <p className="mt-1 mb-3 text-sm text-gray-500">
          Si un cliente deja de visitarte, baja <strong>un nivel</strong> tras los días que definas. Pon <strong>0</strong> para que nunca baje.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Días sin visitar">
            <Input type="number" min={0} value={diasBaja} onChange={e => setDiasBaja(e.target.value)} className="w-32" />
          </Field>
          <Button type="button" variant="secondary" onClick={guardarDiasBaja}>Guardar</Button>
          {diasMsg && <span className="pb-2 text-sm text-gray-500">{diasMsg}</span>}
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">Nuevo nivel</h3>
        <form onSubmit={crear} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <Field label="Nombre del nivel">
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Plata, Oro, VIP…" required />
          </Field>
          <Field label={umbralLabel}>{campoUmbral('nuevo')}</Field>
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
          {ordenar(lista).map(n => {
            const bens = beneficiosDe(n.id);
            return (
              <Card key={n.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editandoId === n.id ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                        <Field label="Nombre del nivel"><Input value={edNombre} onChange={e => setEdNombre(e.target.value)} /></Field>
                        <Field label={umbralLabel}>{campoUmbral('edit')}</Field>
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
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">caduca anual</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm text-gray-500">
                          {esMonto ? `Desde $${n.monto_minimo.toLocaleString('es-MX')} gastados` : `Desde ${n.visitas_minimas} visitas`}
                        </div>
                      </>
                    )}
                    <div className="mt-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Beneficios exclusivos</div>
                      {bens.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-400">Ninguno. Asígnalos desde la pantalla de Beneficios.</p>
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
