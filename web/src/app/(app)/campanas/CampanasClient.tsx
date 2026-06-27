'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export interface Campana {
  id: string;
  titulo: string;
  mensaje: string;
  segmento: string;
  estado: 'borrador' | 'programada' | 'enviada';
  enviados: number;
  creado_en: string;
}

const SEGMENTOS: [string, string][] = [
  ['todos', 'Todos los clientes'],
  ['inactivos_7', 'Inactivos 7+ días'],
  ['inactivos_14', 'Inactivos 14+ días'],
  ['inactivos_30', 'Inactivos 30+ días'],
];
const segLabel = (s: string) => SEGMENTOS.find(([v]) => v === s)?.[1] ?? s;

export function CampanasClient({ negocioId, inicial }: { negocioId: string; inicial: Campana[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<Campana[]>(inicial);
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('campana')
      .insert({ negocio_id: negocioId, titulo, mensaje, segmento })
      .select('id, titulo, mensaje, segmento, estado, enviados, creado_en')
      .single();
    if (data) { setLista([data as Campana, ...lista]); setTitulo(''); setMensaje(''); }
  }

  async function enviar(c: Campana) {
    setEnviandoId(c.id);
    setMsg(null);
    const { data, error } = await supabase.functions.invoke('enviar-campana', { body: { campana_id: c.id } });
    if (error || data?.error) {
      setMsg('Error: ' + (data?.error ?? error?.message));
    } else {
      setMsg(`Campaña enviada a ${data.enviados} cliente(s).`);
      setLista(lista.map(x => (x.id === c.id ? { ...x, estado: 'enviada', enviados: data.enviados } : x)));
    }
    setEnviandoId(null);
  }

  return (
    <div>
      <PageHeader title="Campañas y recordatorios" description="Mensajes a tus clientes. Hoy llegan como notificación en la app." />

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        🔔 Los recordatorios automáticos por inactividad (7/14/30 días) están listos en el backend;
        se activarán junto con las notificaciones push cuando se conecte Firebase.
      </div>

      <Card className="mb-6">
        <form onSubmit={crear} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Título"><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Te extrañamos" required /></Field>
          <Field label="Segmento">
            <Select value={segmento} onChange={e => setSegmento(e.target.value)}>
              {SEGMENTOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Mensaje"><Input value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Vuelve y suma visita 🎉" required /></Field>
          </div>
          <div className="md:col-span-2"><Button type="submit">Crear campaña</Button></div>
        </form>
      </Card>

      {msg && <p className="mb-4 text-sm text-indigo-600">{msg}</p>}

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no has creado campañas.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Enviados</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.titulo}</td>
                  <td className="px-4 py-3 text-gray-600">{segLabel(c.segmento)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.estado === 'enviada' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.enviados}</td>
                  <td className="px-4 py-3 text-right">
                    {c.estado !== 'enviada' && (
                      <Button variant="secondary" onClick={() => enviar(c)} disabled={enviandoId === c.id}>
                        {enviandoId === c.id ? 'Enviando…' : 'Enviar ahora'}
                      </Button>
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
