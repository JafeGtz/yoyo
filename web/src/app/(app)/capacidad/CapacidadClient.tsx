'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export interface BeneficioCap {
  id: string;
  nombre: string;
  estado: 'activo' | 'pausado' | 'archivado';
  stock_total: number | null;
  valor_estimado: number | null;
  vigencia_dias: number;
  // Del RPC capacidad_resumen:
  reservados: number; // ganados sin recoger y no vencidos (comprometido)
  canjeados: number;  // ya recogidos
  canjes_mes: number;
  costo_mes: number;
}

const money = (n: number) => `$${Number(n).toLocaleString('es-MX')}`;

export function CapacidadClient({ inicial }: { inicial: BeneficioCap[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<BeneficioCap[]>(inicial);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [addStock, setAddStock] = useState<Record<string, string>>({});

  const hayActivos = lista.some(b => b.estado === 'activo');

  function editarNum(id: string, campo: 'stock_total' | 'valor_estimado', valor: string) {
    const v = valor.trim() === '' ? null : Number(valor);
    setLista(lista.map(b => (b.id === id ? { ...b, [campo]: v } : b)));
  }

  async function guardar(b: BeneficioCap) {
    setGuardandoId(b.id);
    await supabase
      .from('beneficio')
      .update({ stock_total: b.stock_total, valor_estimado: b.valor_estimado })
      .eq('id', b.id);
    setGuardandoId(null);
  }

  async function reabastecer(b: BeneficioCap) {
    const add = Number(addStock[b.id]);
    if (!add || add <= 0) return;
    const nuevo = (b.stock_total ?? 0) + add;
    setGuardandoId(b.id);
    await supabase.from('beneficio').update({ stock_total: nuevo }).eq('id', b.id);
    setLista(lista.map(x => (x.id === b.id ? { ...x, stock_total: nuevo } : x)));
    setAddStock({ ...addStock, [b.id]: '' });
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
        icon="📦"
        title="Control de capacidad"
        description="Cuánto puedes regalar sin pasarte. El límite se aplica al GANAR: si se acaba el stock, deja de repartirse (a quien ya ganó, se le respeta)."
        action={
          hayActivos
            ? <Button variant="danger" onClick={() => pausarTodo(true)}>Pausar todo</Button>
            : <Button onClick={() => pausarTodo(false)}>Reanudar</Button>
        }
      />

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">No hay beneficios que controlar. Crea beneficios primero.</p>
      ) : (
        <div className="space-y-4">
          {lista.map(b => {
            const ilimitado = b.stock_total == null;
            const fisicoRestante = ilimitado ? null : Math.max(0, b.stock_total! - b.canjeados);
            const disponiblesGanar = ilimitado ? null : b.stock_total! - b.canjeados - b.reservados;
            const agotado = disponiblesGanar != null && disponiblesGanar <= 0;

            return (
              <Card key={b.id}>
                {/* Encabezado */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-gray-900">{b.nombre}</span>
                  <div className="flex items-center gap-2">
                    {agotado && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Agotado</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.estado}
                    </span>
                  </div>
                </div>

                {/* Métricas */}
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="Físico restante" value={ilimitado ? 'Sin límite' : `${fisicoRestante} de ${b.stock_total}`} />
                  <Metric label="Comprometido" value={`${b.reservados}`} hint="ganado sin recoger" />
                  <Metric label="Este mes" value={`${b.canjes_mes} canjes`} />
                  <Metric label="Costo del mes" value={money(b.costo_mes)} />
                </div>

                {/* Edición */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:items-end">
                  <label className="text-sm">
                    <span className="mb-1 block text-gray-500">Costo unitario ($)</span>
                    <Input type="number" min={0} value={b.valor_estimado ?? ''} placeholder="0"
                      onChange={e => editarNum(b.id, 'valor_estimado', e.target.value)} />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-gray-500">Stock total</span>
                    <Input type="number" min={0} value={b.stock_total ?? ''} placeholder="∞ (sin límite)"
                      onChange={e => editarNum(b.id, 'stock_total', e.target.value)} />
                  </label>
                  <div>
                    <Button variant="secondary" onClick={() => guardar(b)} disabled={guardandoId === b.id}>
                      {guardandoId === b.id ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </div>
                  {/* Reabastecer */}
                  <div className="flex items-end gap-2">
                    <label className="flex-1 text-sm">
                      <span className="mb-1 block text-gray-500">Reabastecer (+)</span>
                      <Input type="number" min={1} value={addStock[b.id] ?? ''} placeholder="+50"
                        onChange={e => setAddStock({ ...addStock, [b.id]: e.target.value })} />
                    </label>
                    <Button variant="secondary" onClick={() => reabastecer(b)} disabled={guardandoId === b.id}>Sumar</Button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Vigencia: {b.vigencia_dias} días para recogerlo (se edita en Beneficios). Al vencer sin recoger, la unidad se libera.
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}{hint && <span className="text-gray-400"> · {hint}</span>}</div>
      <div className="mt-0.5 font-semibold text-gray-900">{value}</div>
    </div>
  );
}
