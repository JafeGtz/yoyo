'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, SectionTitle } from '@/components/ui/Card';

interface Reto { id: string; nombre: string; descripcion: string | null; activo: boolean; vence_en: string | null; beneficio_id?: string | null; tipo?: string; meta?: number; catalogo_item_id?: string | null }
interface BeneficioOpcion { id: string; nombre: string }
interface ProductoOpcion { id: string; nombre: string }

const TIPOS = [
  { v: 'visitas', label: 'Por visitas', unidad: 'visitas', ph: '5' },
  { v: 'monto', label: 'Por monto gastado', unidad: 'pesos ($)', ph: '500' },
  { v: 'racha', label: 'Racha de días', unidad: 'días seguidos', ph: '3' },
  { v: 'referidos', label: 'Por referidos', unidad: 'amigos invitados', ph: '2' },
  { v: 'resena', label: 'Por dejar reseña', unidad: 'reseñas', ph: '1' },
  { v: 'producto', label: 'Por comprar un producto', unidad: 'veces', ph: '3' },
] as const;

const metaTexto = (r: Reto) => {
  const t = TIPOS.find(x => x.v === (r.tipo ?? 'visitas'));
  if (r.tipo === 'monto') return `$${r.meta}`;
  return `${r.meta} ${t?.unidad ?? ''}`;
};

export function RetosSection({ negocioId, inicial, beneficios, productos }: { negocioId: string; inicial: Reto[]; beneficios: BeneficioOpcion[]; productos: ProductoOpcion[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<Reto[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<string>('visitas');
  const [meta, setMeta] = useState('5');
  const [benId, setBenId] = useState('');
  const [itemId, setItemId] = useState('');
  const [vence, setVence] = useState('');

  const tipoActual = TIPOS.find(t => t.v === tipo)!;
  const benNombre = (id?: string | null) => beneficios.find(b => b.id === id)?.nombre;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('reto')
      .insert({
        negocio_id: negocioId, ambito: 'negocio', nombre,
        tipo, meta: Number(meta),
        condiciones: { tipo, meta: Number(meta) },
        beneficio_id: benId || null,
        catalogo_item_id: tipo === 'producto' ? (itemId || null) : null,
        vence_en: vence || null,
      })
      .select('id, nombre, descripcion, activo, vence_en, beneficio_id, tipo, meta, catalogo_item_id')
      .single();
    if (data) { setLista([data as Reto, ...lista]); setNombre(''); setMeta('5'); setBenId(''); setItemId(''); setVence(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('reto').delete().eq('id', id);
    setLista(lista.filter(r => r.id !== id));
  }

  return (
    <Card>
      <SectionTitle icon="🎯" title="Retos y misiones" subtitle="El cliente cumple el reto con su actividad y recibe el beneficio en su app" accent="emerald" />
      <form onSubmit={crear} className="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
        <div className="md:col-span-2"><Field label="Reto"><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Cliente frecuente del mes" required /></Field></div>
        <Field label="Tipo">
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label={`Meta (${tipoActual.unidad})`}>
          <Input type="number" min={1} value={meta} onChange={e => setMeta(e.target.value)} placeholder={tipoActual.ph} required />
        </Field>
        {tipo === 'producto' && (
          <Field label="¿Qué producto?">
            <Select value={itemId} onChange={e => setItemId(e.target.value)} required>
              <option value="">Elegir…</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Premio al completar">
          <Select value={benId} onChange={e => setBenId(e.target.value)}>
            <option value="">Ninguno</option>
            {beneficios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </Field>
        <Button type="submit" variant="secondary">Agregar</Button>
      </form>
      {lista.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {lista.map(r => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-800">
                {r.nombre}
                <span className="ml-2 text-xs text-gray-400">· {metaTexto(r)}</span>
                {r.beneficio_id && <span className="ml-2 text-xs text-green-600">→ {benNombre(r.beneficio_id) ?? 'beneficio'}</span>}
              </span>
              <button onClick={() => eliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
