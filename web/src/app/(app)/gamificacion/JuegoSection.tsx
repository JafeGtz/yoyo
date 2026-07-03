'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Premio { id: string; nombre: string; probabilidad: number; activo: boolean; beneficio_id: string | null }
interface BeneficioOpcion { id: string; nombre: string }
interface NivelOpcion { id: string; nombre: string; visitas_minimas: number }
export interface JuegoConfig { juego: string; nivel_membresia_id: string | null; giros_max_dia: number }

export function JuegoSection({
  negocioId, juego, titulo, inicial, beneficios, niveles, config,
}: {
  negocioId: string;
  juego: 'ruleta' | 'rasca';
  titulo: string;
  inicial: Premio[];
  beneficios: BeneficioOpcion[];
  niveles: NivelOpcion[];
  config?: JuegoConfig;
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Premio[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [prob, setProb] = useState('');
  const [benId, setBenId] = useState('');
  const [nivel, setNivel] = useState(config?.nivel_membresia_id ?? '');
  const [giros, setGiros] = useState(String(config?.giros_max_dia ?? 1));
  const [cfgMsg, setCfgMsg] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);
  const [girando, setGirando] = useState(false);

  const suma = lista.reduce((s, p) => s + Number(p.probabilidad), 0);
  const benNombre = (id: string | null) => beneficios.find(b => b.id === id)?.nombre;

  async function guardarConfig() {
    setCfgMsg('');
    const { error } = await supabase.from('juego_config').upsert(
      { negocio_id: negocioId, juego, nivel_membresia_id: nivel || null, giros_max_dia: Number(giros) || 1 },
      { onConflict: 'negocio_id,juego' },
    );
    setCfgMsg(error ? error.message : 'Guardado ✓');
  }

  async function probar() {
    setGirando(true);
    setResultado(null);
    const { data, error } = await supabase.functions.invoke('girar-juego', { body: { negocio_id: negocioId, juego } });
    setResultado(error || data?.error ? `Error: ${data?.error ?? 'sin premios'}` : `🎉 ${data.premio}${data.canjeable ? ' (ya en beneficios)' : ''}`);
    setGirando(false);
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('premio_juego')
      .insert({ negocio_id: negocioId, juego, nombre, probabilidad: Number(prob), beneficio_id: benId || null })
      .select('id, nombre, probabilidad, activo, beneficio_id')
      .single();
    if (data) { setLista([...lista, data as Premio]); setNombre(''); setProb(''); setBenId(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('premio_juego').delete().eq('id', id);
    setLista(lista.filter(p => p.id !== id));
  }

  return (
    <Card>
      <h3 className="mb-3 font-medium text-gray-900">{titulo}</h3>

      {/* Config: quién puede jugar y cuántas veces */}
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-3 sm:items-end">
        <Field label="¿Quién puede jugar?">
          <Select value={nivel} onChange={e => setNivel(e.target.value)}>
            <option value="">Todos los clientes</option>
            {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre} o superior</option>)}
          </Select>
        </Field>
        <Field label="Giros por día"><Input type="number" min={1} value={giros} onChange={e => setGiros(e.target.value)} /></Field>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={guardarConfig}>Guardar config</Button>
          {cfgMsg && <span className={`text-xs ${cfgMsg.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>{cfgMsg}</span>}
        </div>
      </div>

      {/* Alta de premio */}
      <form onSubmit={crear} className="grid grid-cols-1 gap-2 sm:grid-cols-6 sm:items-end">
        <div className="sm:col-span-2"><Field label="Premio (texto)"><Input value={nombre} onChange={e => setNombre(e.target.value)} required /></Field></div>
        <div className="sm:col-span-2"><Field label="Beneficio que entrega">
          <Select value={benId} onChange={e => setBenId(e.target.value)}>
            <option value="">Sin premio (solo texto)</option>
            {beneficios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </Field></div>
        <Field label="Prob. %"><Input type="number" min={0} max={100} step="0.1" value={prob} onChange={e => setProb(e.target.value)} required /></Field>
        <Button type="submit" variant="secondary">+</Button>
      </form>

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs ${Math.abs(suma - 100) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
          Suma: {suma.toFixed(1)}% {Math.abs(suma - 100) < 0.01 ? '✓' : '(debe sumar 100%)'}
        </span>
        {lista.length > 0 && (
          <button onClick={probar} disabled={girando} className="text-xs text-indigo-600 hover:underline">
            {girando ? 'Girando…' : 'Probar giro'}
          </button>
        )}
      </div>
      {resultado && <div className="mt-1 text-sm font-medium text-gray-800">{resultado}</div>}

      {lista.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100">
          {lista.map(p => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-800">
                {p.nombre}
                {p.beneficio_id
                  ? <span className="ml-2 text-xs text-green-600">→ {benNombre(p.beneficio_id) ?? 'beneficio'}</span>
                  : <span className="ml-2 text-xs text-gray-400">solo texto</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-gray-500">{Number(p.probabilidad)}%</span>
                <button onClick={() => eliminar(p.id)} className="text-red-600 hover:underline">×</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
