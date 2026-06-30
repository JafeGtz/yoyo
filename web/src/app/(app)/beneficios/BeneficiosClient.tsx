'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export interface Beneficio {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  condicion_tipo: 'visitas' | 'monto' | 'combinado';
  condicion_visitas: number | null;
  condicion_monto: number | null;
  vigencia_dias: number;
  valor_estimado: number | null;
  stock_total: number | null;
  cupo_dia: number | null;
  requiere_reserva: boolean;
  estado: 'activo' | 'pausado' | 'archivado';
  nivel_membresia_id: string | null;
}

export interface NivelOpcion {
  id: string;
  nombre: string;
}

const TIPOS = [
  ['producto_gratis', 'Producto gratis'],
  ['servicio_gratis', 'Servicio gratis'],
  ['descuento_porcentual', 'Descuento %'],
  ['descuento_fijo', 'Descuento fijo'],
  ['upgrade', 'Upgrade'],
  ['combo_2x1', 'Combo / 2x1'],
  ['acceso_exclusivo', 'Acceso exclusivo'],
  ['regalo_sorpresa', 'Regalo sorpresa'],
] as const;

const tipoLabel = (t: string) => TIPOS.find(([v]) => v === t)?.[1] ?? t;

const condicionTexto = (b: Beneficio) => {
  const v = b.condicion_visitas ? `${b.condicion_visitas} visitas` : '';
  const m = b.condicion_monto ? `$${b.condicion_monto}` : '';
  if (b.condicion_tipo === 'combinado') return [v, m].filter(Boolean).join(' + ');
  return b.condicion_tipo === 'monto' ? m : v;
};

const vacio = {
  nombre: '',
  descripcion: '',
  tipo: TIPOS[0][0] as string,
  condicion_tipo: 'visitas' as 'visitas' | 'monto' | 'combinado',
  condicion_visitas: '5',
  condicion_monto: '',
  vigencia_dias: '7',
  valor_estimado: '',
  stock_total: '',
  cupo_dia: '',
  requiere_reserva: false,
  nivel_membresia_id: '',
};

export function BeneficiosClient({
  negocioId,
  esPlus,
  niveles,
  inicial,
}: {
  negocioId: string;
  esPlus: boolean;
  niveles: NivelOpcion[];
  inicial: Beneficio[];
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Beneficio[]>(inicial);
  const [f, setF] = useState({ ...vacio });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (k: keyof typeof vacio, v: string | boolean) => setF(p => ({ ...p, [k]: v }));
  const usaVisitas = f.condicion_tipo === 'visitas' || f.condicion_tipo === 'combinado';
  const usaMonto = f.condicion_tipo === 'monto' || f.condicion_tipo === 'combinado';

  const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));
  const SELECT =
    'id, nombre, descripcion, tipo, condicion_tipo, condicion_visitas, condicion_monto, vigencia_dias, valor_estimado, stock_total, cupo_dia, requiere_reserva, estado, nivel_membresia_id';

  function editar(b: Beneficio) {
    setEditandoId(b.id);
    setError(null);
    setF({
      nombre: b.nombre,
      descripcion: b.descripcion ?? '',
      tipo: b.tipo,
      condicion_tipo: b.condicion_tipo,
      condicion_visitas: b.condicion_visitas?.toString() ?? '',
      condicion_monto: b.condicion_monto?.toString() ?? '',
      vigencia_dias: b.vigencia_dias.toString(),
      valor_estimado: b.valor_estimado?.toString() ?? '',
      stock_total: b.stock_total?.toString() ?? '',
      cupo_dia: b.cupo_dia?.toString() ?? '',
      requiere_reserva: b.requiere_reserva,
      nivel_membresia_id: b.nivel_membresia_id ?? '',
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setEditandoId(null);
    setF({ ...vacio });
    setError(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const payload = {
      negocio_id: negocioId,
      nombre: f.nombre,
      descripcion: f.descripcion || null,
      tipo: f.tipo,
      condicion_tipo: f.condicion_tipo,
      condicion_visitas: usaVisitas ? numOrNull(f.condicion_visitas) : null,
      condicion_monto: usaMonto ? numOrNull(f.condicion_monto) : null,
      vigencia_dias: Number(f.vigencia_dias),
      valor_estimado: numOrNull(f.valor_estimado),
      stock_total: numOrNull(f.stock_total),
      cupo_dia: numOrNull(f.cupo_dia),
      requiere_reserva: f.requiere_reserva,
      nivel_membresia_id: f.nivel_membresia_id || null,
    };

    if (editandoId) {
      const { data, error } = await supabase.from('beneficio').update(payload).eq('id', editandoId).select(SELECT).single();
      if (error) setError(error.message);
      else if (data) {
        setLista(lista.map(x => (x.id === editandoId ? (data as Beneficio) : x)));
        setEditandoId(null);
        setF({ ...vacio });
      }
    } else {
      const { data, error } = await supabase.from('beneficio').insert(payload).select(SELECT).single();
      if (error) setError(error.message);
      else if (data) {
        setLista([data as Beneficio, ...lista]);
        setF({ ...vacio });
      }
    }
    setGuardando(false);
  }

  async function alternarPausa(b: Beneficio) {
    const nuevo = b.estado === 'activo' ? 'pausado' : 'activo';
    await supabase.from('beneficio').update({ estado: nuevo }).eq('id', b.id);
    setLista(lista.map(x => (x.id === b.id ? { ...x, estado: nuevo } : x)));
  }

  async function archivar(b: Beneficio) {
    await supabase.from('beneficio').update({ estado: 'archivado' }).eq('id', b.id);
    setLista(lista.filter(x => x.id !== b.id));
  }

  return (
    <div>
      <PageHeader title="Beneficios" description="Configura los premios que tus clientes desbloquean." />

      <Card className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">{editandoId ? 'Editar beneficio' : 'Nuevo beneficio'}</h3>
        <form onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Corte gratis" required />
            </Field>
          </div>
          <Field label="Tipo">
            <Select value={f.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>

          <div className="md:col-span-3">
            <Field label="Descripción (opcional)">
              <Input value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej. Corte de cabello completo, válido de lunes a jueves" />
            </Field>
          </div>

          <Field label="Se desbloquea por">
            <Select value={f.condicion_tipo} onChange={e => set('condicion_tipo', e.target.value)}>
              <option value="visitas">Visitas</option>
              {esPlus && <option value="monto">Monto consumido</option>}
              {esPlus && <option value="combinado">Visitas + monto</option>}
            </Select>
          </Field>
          {usaVisitas && (
            <Field label="N.º de visitas">
              <Input type="number" min={1} value={f.condicion_visitas} onChange={e => set('condicion_visitas', e.target.value)} required />
            </Field>
          )}
          {usaMonto && (
            <Field label="Monto mínimo ($)">
              <Input type="number" min={0} value={f.condicion_monto} onChange={e => set('condicion_monto', e.target.value)} required />
            </Field>
          )}

          <Field label="Vigencia (días)">
            <Input type="number" min={1} value={f.vigencia_dias} onChange={e => set('vigencia_dias', e.target.value)} required />
          </Field>
          <Field label="Valor estimado ($) — lo que te cuesta">
            <Input type="number" min={0} value={f.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="Stock total (unidades)">
            <Input type="number" min={0} value={f.stock_total} onChange={e => set('stock_total', e.target.value)} placeholder="Sin límite" />
          </Field>
          <Field label="Cupo por día">
            <Input type="number" min={0} value={f.cupo_dia} onChange={e => set('cupo_dia', e.target.value)} placeholder="Sin límite" />
          </Field>
          <Field label="Exclusivo del nivel (opcional)">
            <Select value={f.nivel_membresia_id} onChange={e => set('nivel_membresia_id', e.target.value)}>
              <option value="">Para todos los clientes</option>
              {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </Select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={f.requiere_reserva} onChange={e => set('requiere_reserva', e.target.checked)} />
            Requiere reserva
          </label>

          <div className="md:col-span-3">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Agregar beneficio'}
              </Button>
              {editandoId && (
                <button type="button" onClick={cancelar} className="text-sm text-gray-500 hover:underline">Cancelar</button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no tienes beneficios. Crea el primero arriba.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Condición</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Cupo/día</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{tipoLabel(b.tipo)}</td>
                  <td className="px-4 py-3 text-gray-600">{condicionTexto(b)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.nivel_membresia_id ? niveles.find(n => n.id === b.nivel_membresia_id)?.nombre ?? '—' : 'Todos'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.valor_estimado != null ? `$${b.valor_estimado}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.stock_total ?? '∞'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.cupo_dia ?? '∞'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => editar(b)} className="mr-3 text-gray-700 hover:underline">Editar</button>
                    <button onClick={() => alternarPausa(b)} className="mr-3 text-indigo-600 hover:underline">
                      {b.estado === 'activo' ? 'Pausar' : 'Activar'}
                    </button>
                    <button onClick={() => archivar(b)} className="text-red-600 hover:underline">Archivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
