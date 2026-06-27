'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

interface Beneficio { id: string; estado: string; vence_en: string | null; beneficio: { nombre: string } | null }
interface Visita { id: string; creado_en: string; monto: number | null }
interface Resena { id: string; estrellas: number | null; comentario: string | null; nps: number | null; creada_en: string }
interface Ajuste { id: string; delta: number; motivo: string | null; creado_en: string }

export function FichaClient(props: {
  clienteNegocioId: string;
  nombre: string;
  celular: string | null;
  nivel: string | null;
  visitasIniciales: number;
  montoAcumulado: number;
  bloqueadoInicial: boolean;
  notasIniciales: string;
  beneficios: Beneficio[];
  visitas: Visita[];
  resenas: Resena[];
  ajustes: Ajuste[];
}) {
  const supabase = createClient();
  const [visitas, setVisitas] = useState(props.visitasIniciales);
  const [bloqueado, setBloqueado] = useState(props.bloqueadoInicial);
  const [notas, setNotas] = useState(props.notasIniciales);
  const [delta, setDelta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [ajustes, setAjustes] = useState(props.ajustes);
  const [msg, setMsg] = useState<string | null>(null);

  async function guardarNotas() {
    await supabase.from('cliente_negocio').update({ notas }).eq('id', props.clienteNegocioId);
    setMsg('Notas guardadas.');
  }

  async function alternarBloqueo() {
    const nuevo = !bloqueado;
    await supabase.from('cliente_negocio').update({ bloqueado: nuevo }).eq('id', props.clienteNegocioId);
    setBloqueado(nuevo);
  }

  async function ajustar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const d = Number(delta);
    if (!d) return;
    const { data, error } = await supabase.rpc('ajustar_visitas', {
      p_cliente_negocio_id: props.clienteNegocioId,
      p_delta: d,
      p_motivo: motivo || null,
    });
    if (error) {
      setMsg('Error: ' + error.message);
      return;
    }
    setVisitas(data as number);
    setAjustes([{ id: crypto.randomUUID(), delta: d, motivo: motivo || null, creado_en: new Date().toISOString() }, ...ajustes]);
    setDelta('');
    setMotivo('');
    setMsg('Visitas ajustadas.');
  }

  return (
    <div>
      <PageHeader
        title={props.nombre}
        description={`${props.celular ?? 'sin celular'} · Nivel ${props.nivel ?? '—'}`}
        action={
          <Button variant={bloqueado ? 'secondary' : 'danger'} onClick={alternarBloqueo}>
            {bloqueado ? 'Desbloquear cliente' : 'Bloquear cliente'}
          </Button>
        }
      />
      {msg && <p className="mb-4 text-sm text-indigo-600">{msg}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Visitas</div>
          <div className="text-3xl font-semibold text-gray-900">{visitas}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Monto acumulado</div>
          <div className="text-3xl font-semibold text-gray-900">${props.montoAcumulado}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Beneficios activos</div>
          <div className="text-3xl font-semibold text-gray-900">
            {props.beneficios.filter(b => b.estado === 'disponible').length}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ajuste manual de visitas */}
        <Card>
          <h3 className="mb-3 font-medium text-gray-900">Ajuste manual de visitas</h3>
          <form onSubmit={ajustar} className="flex items-end gap-3">
            <Field label="Cambio (+/−)">
              <Input type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="+1 / -1" required />
            </Field>
            <div className="flex-1">
              <Field label="Motivo">
                <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Corrección, cortesía…" />
              </Field>
            </div>
            <Button type="submit">Aplicar</Button>
          </form>
          {ajustes.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              {ajustes.slice(0, 5).map(a => (
                <li key={a.id}>
                  {a.delta > 0 ? `+${a.delta}` : a.delta} · {a.motivo ?? 'sin motivo'} ·{' '}
                  {new Date(a.creado_en).toLocaleDateString('es-MX')}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Notas privadas */}
        <Card>
          <h3 className="mb-3 font-medium text-gray-900">Notas privadas</h3>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
            placeholder="Notas internas sobre este cliente…"
          />
          <Button variant="secondary" onClick={guardarNotas} className="mt-2">Guardar notas</Button>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Beneficios */}
        <Card>
          <h3 className="mb-3 font-medium text-gray-900">Beneficios</h3>
          {props.beneficios.length === 0 ? (
            <p className="text-sm text-gray-400">Ninguno.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {props.beneficios.map(b => (
                <li key={b.id} className="flex justify-between">
                  <span className="text-gray-700">{b.beneficio?.nombre ?? '—'}</span>
                  <span className="text-gray-400">{b.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Historial de visitas */}
        <Card>
          <h3 className="mb-3 font-medium text-gray-900">Historial de visitas</h3>
          {props.visitas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin visitas.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-600">
              {props.visitas.map(v => (
                <li key={v.id} className="flex justify-between">
                  <span>{new Date(v.creado_en).toLocaleString('es-MX')}</span>
                  {v.monto != null && <span>${v.monto}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Reseñas del cliente */}
      <Card className="mt-4">
        <h3 className="mb-3 font-medium text-gray-900">Reseñas de este cliente</h3>
        {props.resenas.length === 0 ? (
          <p className="text-sm text-gray-400">Sin reseñas.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {props.resenas.map(r => (
              <li key={r.id}>
                <span className="text-yellow-500">{'★'.repeat(r.estrellas ?? 0)}</span>{' '}
                {r.comentario && <span className="text-gray-700">{r.comentario}</span>}
                {r.nps != null && <span className="text-gray-400"> · NPS {r.nps}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
