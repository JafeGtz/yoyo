'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';
import { ConfigCitas } from './ConfigCitas';
import { CalendarioSemana } from './CalendarioSemana';

export interface Cita {
  id: string;
  servicio: string | null;
  inicia_en: string;
  duracion_min: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  cliente: { nombre: string } | null;
}
export interface ClienteOpcion { id: string; nombre: string }
export type CitasModo = 'desactivado' | 'solicitud' | 'agenda';
export interface AgendaConfig {
  dias?: number[];
  hora_inicio?: string;
  hora_fin?: string;
  duracion_min?: number;
  descanso_inicio?: string;
  descanso_fin?: string;
  timezone?: string;
}

const COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
};

export function CitasClient({
  negocioId,
  inicial,
  clientes,
  modoInicial,
  configInicial,
}: {
  negocioId: string;
  inicial: Cita[];
  clientes: ClienteOpcion[];
  modoInicial: CitasModo;
  configInicial: AgendaConfig;
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Cita[]>(inicial);
  const [clienteId, setClienteId] = useState('');
  const [servicio, setServicio] = useState('');
  const [cuando, setCuando] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<'lista' | 'calendario'>('calendario');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clienteId) { setError('Elige un cliente.'); return; }
    const { data, error } = await supabase
      .from('cita')
      .insert({
        negocio_id: negocioId,
        cliente_id: clienteId,
        servicio: servicio || null,
        inicia_en: new Date(cuando).toISOString(),
        duracion_min: Number(duracion),
        estado: 'confirmada',
      })
      .select('id, servicio, inicia_en, duracion_min, estado, cliente:cliente_id(nombre)')
      .single();
    if (error) setError(error.message);
    else if (data) {
      setLista([...lista, data as unknown as Cita].sort((a, b) => a.inicia_en.localeCompare(b.inicia_en)));
      setServicio(''); setCuando('');
    }
  }

  async function cambiarEstado(c: Cita, estado: Cita['estado']) {
    await supabase.from('cita').update({ estado }).eq('id', c.id);
    setLista(lista.map(x => (x.id === c.id ? { ...x, estado } : x)));
  }

  return (
    <div>
      <PageHeader title="Agenda de citas" description="Reservas de tus clientes. Confirma, cancela o márcalas como completadas." />

      <ConfigCitas negocioId={negocioId} modoInicial={modoInicial} configInicial={configInicial} />

      <Card className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">Agendar cita</h3>
        <form onSubmit={crear} className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
          <Field label="Cliente">
            <Select value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">Elegir…</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Servicio"><Input value={servicio} onChange={e => setServicio(e.target.value)} placeholder="Corte" /></Field>
          <Field label="Fecha y hora"><Input type="datetime-local" value={cuando} onChange={e => setCuando(e.target.value)} required /></Field>
          <Field label="Duración (min)"><Input type="number" min={5} step={5} value={duracion} onChange={e => setDuracion(e.target.value)} /></Field>
          <Button type="submit">Agendar</Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {clientes.length === 0 && <p className="mt-2 text-sm text-gray-400">Necesitas clientes registrados para agendar.</p>}
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Citas</h3>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          <button onClick={() => setVista('calendario')} className={`rounded-md px-3 py-1 text-sm ${vista === 'calendario' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Calendario</button>
          <button onClick={() => setVista('lista')} className={`rounded-md px-3 py-1 text-sm ${vista === 'lista' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Lista</button>
        </div>
      </div>

      {vista === 'calendario' ? (
        <CalendarioSemana citas={lista} />
      ) : lista.length === 0 ? (
        <p className="text-sm text-gray-500">No hay citas agendadas.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-gray-700">{new Date(c.inicia_en).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 text-gray-900">{c.cliente?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.servicio ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[c.estado]}`}>{c.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {c.estado !== 'completada' && c.estado !== 'cancelada' && (
                      <>
                        {c.estado === 'pendiente' && (
                          <button onClick={() => cambiarEstado(c, 'confirmada')} className="mr-3 text-green-600 hover:underline">Confirmar</button>
                        )}
                        <button onClick={() => cambiarEstado(c, 'completada')} className="mr-3 text-indigo-600 hover:underline">Completar</button>
                        <button onClick={() => cambiarEstado(c, 'cancelada')} className="text-red-600 hover:underline">Cancelar</button>
                      </>
                    )}
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
