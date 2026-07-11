'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';

export interface Empleado { id: string; nombre: string; rol: string }
export interface Turno { id: string; usuario_negocio_id: string; fecha: string; hora_inicio: string; hora_fin: string; notas: string | null }
export interface Asistencia { id: string; usuario_negocio_id: string; entrada: string; salida: string | null }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fechaLarga(f: string) {
  const d = new Date(f + 'T00:00:00');
  return `${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}
const hhmm = (t: string) => t.slice(0, 5);
function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
function horasEntre(a: string, b: string | null) {
  if (!b) return null;
  const h = (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
  return h > 0 ? h.toFixed(1) : '0';
}

export function TurnosClient({
  negocioId, empleados, inicialTurnos, inicialAsistencia,
}: {
  negocioId: string;
  empleados: Empleado[];
  inicialTurnos: Turno[];
  inicialAsistencia: Asistencia[];
}) {
  const supabase = createClient();
  const [turnos, setTurnos] = useState<Turno[]>(inicialTurnos);
  const asistencia = inicialAsistencia;

  const hoy = new Date().toISOString().slice(0, 10);
  const [emp, setEmp] = useState(empleados[0]?.id ?? '');
  const [fecha, setFecha] = useState(hoy);
  const [ini, setIni] = useState('09:00');
  const [fin, setFin] = useState('18:00');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  const nombreDe = useMemo(() => {
    const m = new Map(empleados.map(e => [e.id, e.nombre]));
    return (id: string) => m.get(id) ?? '—';
  }, [empleados]);

  // Agrupa turnos por fecha.
  const porFecha = useMemo(() => {
    const g: { fecha: string; items: Turno[] }[] = [];
    for (const t of turnos) {
      let b = g.find(x => x.fecha === t.fecha);
      if (!b) { b = { fecha: t.fecha, items: [] }; g.push(b); }
      b.items.push(t);
    }
    return g;
  }, [turnos]);

  async function agregar() {
    if (!emp) { setMsg('Agrega empleados primero (módulo Personal).'); return; }
    if (fin <= ini) { setMsg('La hora de fin debe ser mayor a la de inicio.'); return; }
    setGuardando(true); setMsg('');
    const { data, error } = await supabase.from('turno')
      .insert({ negocio_id: negocioId, usuario_negocio_id: emp, fecha, hora_inicio: ini, hora_fin: fin })
      .select('id, usuario_negocio_id, fecha, hora_inicio, hora_fin, notas')
      .single();
    setGuardando(false);
    if (error) { setMsg(error.message); return; }
    const nuevo = data as Turno;
    setTurnos(prev => [...prev, nuevo].sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio)));
    setMsg('Turno agregado ✓');
  }

  async function eliminar(id: string) {
    setTurnos(prev => prev.filter(t => t.id !== id));
    await supabase.from('turno').delete().eq('id', id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Turnos y asistencia</h1>
        <p className="text-sm text-gray-500">Arma los horarios de tu equipo y revisa sus entradas y salidas.</p>
      </div>

      {/* Alta de turno */}
      <Card>
        <SectionTitle icon="🗓️" title="Programar turno" subtitle="Asigna un horario a un empleado" accent="indigo" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
          <Field label="Empleado">
            <Select value={emp} onChange={e => setEmp(e.target.value)}>
              {empleados.length === 0 && <option value="">Sin empleados</option>}
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}{e.rol === 'dueno' ? ' (dueño)' : ''}</option>)}
            </Select>
          </Field>
          <Field label="Día"><Input type="date" min={hoy} value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
          <Field label="Entra"><Input type="time" value={ini} onChange={e => setIni(e.target.value)} /></Field>
          <Field label="Sale"><Input type="time" value={fin} onChange={e => setFin(e.target.value)} /></Field>
          <Button type="button" onClick={agregar} disabled={guardando}>Agregar turno</Button>
        </div>
        {msg && <p className="mt-2 text-sm text-gray-500">{msg}</p>}
      </Card>

      {/* Próximos turnos */}
      <Card>
        <SectionTitle icon="📋" title="Próximos turnos" subtitle="De hoy en adelante" accent="emerald" />
        {porFecha.length === 0 ? (
          <p className="text-sm text-gray-500">No hay turnos programados.</p>
        ) : (
          <div className="space-y-4">
            {porFecha.map(g => (
              <div key={g.fecha}>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">{fechaLarga(g.fecha)}</div>
                <ul className="divide-y divide-gray-100">
                  {g.items.map(t => (
                    <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-800">{nombreDe(t.usuario_negocio_id)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{hhmm(t.hora_inicio)} – {hhmm(t.hora_fin)}</span>
                        <button onClick={() => eliminar(t.id)} className="text-red-600 hover:underline">Quitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Asistencia */}
      <Card>
        <SectionTitle icon="⏱️" title="Asistencia reciente" subtitle="Entradas y salidas registradas por el empleado" accent="amber" />
        {asistencia.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay registros de asistencia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2">Empleado</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asistencia.map(a => (
                  <tr key={a.id}>
                    <td className="py-2 text-gray-800">{nombreDe(a.usuario_negocio_id)}</td>
                    <td className="text-gray-500">{new Date(a.entrada).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                    <td className="text-gray-500">{horaDe(a.entrada)}</td>
                    <td className="text-gray-500">{a.salida ? horaDe(a.salida) : <span className="text-emerald-600 font-medium">En turno…</span>}</td>
                    <td className="text-gray-800">{horasEntre(a.entrada, a.salida) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
