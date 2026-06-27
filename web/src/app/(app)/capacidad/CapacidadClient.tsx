'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

interface Horario { dias: number[]; inicio: string; fin: string }

export interface BeneficioCap {
  id: string;
  nombre: string;
  estado: 'activo' | 'pausado' | 'archivado';
  cupo_dia: number | null;
  cupo_semana: number | null;
  cupo_mes: number | null;
  stock_total: number | null;
  horario: Horario | null;
}

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function CapacidadClient({ inicial }: { inicial: BeneficioCap[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<BeneficioCap[]>(inicial);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const hayActivos = lista.some(b => b.estado === 'activo');

  function editarNum(id: string, campo: keyof BeneficioCap, valor: string) {
    const v = valor.trim() === '' ? null : Number(valor);
    setLista(lista.map(b => (b.id === id ? { ...b, [campo]: v } : b)));
  }

  function toggleDia(id: string, dia: number) {
    setLista(lista.map(b => {
      if (b.id !== id) return b;
      const h: Horario = b.horario ?? { dias: [], inicio: '09:00', fin: '20:00' };
      const dias = h.dias.includes(dia) ? h.dias.filter(d => d !== dia) : [...h.dias, dia];
      return { ...b, horario: { ...h, dias } };
    }));
  }

  function editarHora(id: string, campo: 'inicio' | 'fin', valor: string) {
    setLista(lista.map(b => {
      if (b.id !== id) return b;
      const h: Horario = b.horario ?? { dias: [], inicio: '09:00', fin: '20:00' };
      return { ...b, horario: { ...h, [campo]: valor } };
    }));
  }

  async function guardar(b: BeneficioCap) {
    setGuardandoId(b.id);
    // Si no hay días seleccionados, se considera "sin restricción" -> horario null.
    const horario = b.horario && b.horario.dias.length > 0 ? b.horario : null;
    await supabase
      .from('beneficio')
      .update({
        cupo_dia: b.cupo_dia, cupo_semana: b.cupo_semana, cupo_mes: b.cupo_mes,
        stock_total: b.stock_total, horario,
      })
      .eq('id', b.id);
    setGuardandoId(null);
  }

  async function pausarTodo(pausar: boolean) {
    const ids = lista.filter(b => b.estado === (pausar ? 'activo' : 'pausado')).map(b => b.id);
    if (ids.length === 0) return;
    await supabase.from('beneficio').update({ estado: pausar ? 'pausado' : 'activo' }).in('id', ids);
    setLista(lista.map(b => (ids.includes(b.id) ? { ...b, estado: pausar ? 'pausado' : 'activo' } : b)));
  }

  return (
    <div>
      <PageHeader
        title="Control de capacidad"
        description="Límites de canje, horarios y pausa de emergencia del programa."
        action={
          hayActivos
            ? <Button variant="danger" onClick={() => pausarTodo(true)}>Pausar todo</Button>
            : <Button onClick={() => pausarTodo(false)}>Reanudar</Button>
        }
      />

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">No hay beneficios que limitar. Crea beneficios primero.</p>
      ) : (
        <div className="space-y-4">
          {lista.map(b => (
            <Card key={b.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">{b.nombre}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {b.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <label className="text-sm">
                  <span className="mb-1 block text-gray-500">Cupo/día</span>
                  <Input type="number" min={0} value={b.cupo_dia ?? ''} placeholder="∞" onChange={e => editarNum(b.id, 'cupo_dia', e.target.value)} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-500">Cupo/semana</span>
                  <Input type="number" min={0} value={b.cupo_semana ?? ''} placeholder="∞" onChange={e => editarNum(b.id, 'cupo_semana', e.target.value)} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-500">Cupo/mes</span>
                  <Input type="number" min={0} value={b.cupo_mes ?? ''} placeholder="∞" onChange={e => editarNum(b.id, 'cupo_mes', e.target.value)} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-500">Stock total</span>
                  <Input type="number" min={0} value={b.stock_total ?? ''} placeholder="∞" onChange={e => editarNum(b.id, 'stock_total', e.target.value)} />
                </label>
              </div>

              <div className="mt-4">
                <span className="mb-2 block text-sm text-gray-500">Horario de canje (vacío = cualquier día/hora)</span>
                <div className="flex flex-wrap items-center gap-2">
                  {DIAS.map((d, i) => {
                    const activo = b.horario?.dias.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDia(b.id, i)}
                        className={`h-8 w-8 rounded-full text-sm font-medium ${activo ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                  <input type="time" value={b.horario?.inicio ?? '09:00'} onChange={e => editarHora(b.id, 'inicio', e.target.value)}
                    className="ml-2 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900" />
                  <span className="text-gray-400">a</span>
                  <input type="time" value={b.horario?.fin ?? '20:00'} onChange={e => editarHora(b.id, 'fin', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900" />
                </div>
              </div>

              <div className="mt-4">
                <Button variant="secondary" onClick={() => guardar(b)} disabled={guardandoId === b.id}>
                  {guardandoId === b.id ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
