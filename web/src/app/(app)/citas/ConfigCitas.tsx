'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CitasModo, AgendaConfig } from './CitasClient';

const DIAS = [
  { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mié' }, { v: 4, l: 'Jue' },
  { v: 5, l: 'Vie' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' },
];

const OPCIONES: { v: CitasModo; t: string; d: string }[] = [
  { v: 'desactivado', t: 'Desactivado', d: 'Tus clientes no pueden reservar desde la app.' },
  { v: 'solicitud', t: 'Solo solicitud', d: 'El cliente propone fecha y hora; tú confirmas o rechazas.' },
  { v: 'agenda', t: 'Agenda con horarios', d: 'El cliente ve tus huecos libres y reserva al instante.' },
];

export function ConfigCitas({
  negocioId,
  modoInicial,
  configInicial,
  onModo,
}: {
  negocioId: string;
  modoInicial: CitasModo;
  configInicial: AgendaConfig;
  onModo?: (m: CitasModo) => void;
}) {
  const supabase = createClient();
  const [modo, setModo] = useState<CitasModo>(modoInicial);
  const [dias, setDias] = useState<number[]>(configInicial.dias ?? [1, 2, 3, 4, 5]);
  const [hIni, setHIni] = useState(configInicial.hora_inicio ?? '09:00');
  const [hFin, setHFin] = useState(configInicial.hora_fin ?? '18:00');
  const [dur, setDur] = useState(String(configInicial.duracion_min ?? 30));
  const [descIni, setDescIni] = useState(configInicial.descanso_inicio ?? '');
  const [descFin, setDescFin] = useState(configInicial.descanso_fin ?? '');
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  function toggleDia(v: number) {
    setDias(d => (d.includes(v) ? d.filter(x => x !== v) : [...d, v]));
  }

  async function guardar() {
    if (modo === 'agenda' && dias.length === 0) { setMsg('Elige al menos un día.'); return; }
    setGuardando(true);
    setMsg('');
    const cfg: AgendaConfig = modo === 'agenda'
      ? {
          dias,
          hora_inicio: hIni,
          hora_fin: hFin,
          duracion_min: Number(dur),
          ...(descIni && descFin ? { descanso_inicio: descIni, descanso_fin: descFin } : {}),
        }
      : {};
    const { error } = await supabase.from('negocio').update({ citas_modo: modo, agenda_config: cfg }).eq('id', negocioId);
    setGuardando(false);
    if (error) setMsg(error.message);
    else { setMsg('Guardado ✓'); onModo?.(modo); }
  }

  return (
    <Card className="mb-6">
      <h3 className="font-medium text-gray-900">Reservas de clientes</h3>
      <p className="mt-1 mb-4 text-sm text-gray-500">Define cómo pueden agendar tus clientes desde la app.</p>

      <div className="grid gap-2 sm:grid-cols-3">
        {OPCIONES.map(o => (
          <button
            key={o.v}
            type="button"
            onClick={() => setModo(o.v)}
            className={`rounded-xl border p-3 text-left transition ${modo === o.v ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-sm font-medium text-gray-900">{o.t}</div>
            <div className="mt-0.5 text-xs text-gray-500">{o.d}</div>
          </button>
        ))}
      </div>

      {modo === 'agenda' && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Días que atiendes</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {DIAS.map(d => (
              <button
                key={d.v}
                type="button"
                onClick={() => toggleDia(d.v)}
                className={`h-9 w-12 rounded-lg border text-sm ${dias.includes(d.v) ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {d.l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Abre"><Input type="time" value={hIni} onChange={e => setHIni(e.target.value)} /></Field>
            <Field label="Cierra"><Input type="time" value={hFin} onChange={e => setHFin(e.target.value)} /></Field>
            <Field label="Duración (min)"><Input type="number" min={5} step={5} value={dur} onChange={e => setDur(e.target.value)} /></Field>
          </div>
          <p className="mt-4 mb-2 text-sm font-medium text-gray-700">Descanso (opcional)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Desde"><Input type="time" value={descIni} onChange={e => setDescIni(e.target.value)} /></Field>
            <Field label="Hasta"><Input type="time" value={descFin} onChange={e => setDescFin(e.target.value)} /></Field>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
        {msg && <span className={`text-sm ${msg.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>}
      </div>
    </Card>
  );
}
