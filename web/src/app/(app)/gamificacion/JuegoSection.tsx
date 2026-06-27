'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Premio { id: string; nombre: string; probabilidad: number; activo: boolean }

export function JuegoSection({
  negocioId,
  juego,
  titulo,
  inicial,
}: {
  negocioId: string;
  juego: 'ruleta' | 'rasca';
  titulo: string;
  inicial: Premio[];
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Premio[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [prob, setProb] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);
  const [girando, setGirando] = useState(false);

  const suma = lista.reduce((s, p) => s + Number(p.probabilidad), 0);

  async function probar() {
    setGirando(true);
    setResultado(null);
    const { data, error } = await supabase.functions.invoke('girar-juego', {
      body: { negocio_id: negocioId, juego },
    });
    setResultado(error || data?.error ? 'Error / sin premios' : `🎉 ${data.premio}`);
    setGirando(false);
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from('premio_juego')
      .insert({ negocio_id: negocioId, juego, nombre, probabilidad: Number(prob) })
      .select('id, nombre, probabilidad, activo')
      .single();
    if (data) { setLista([...lista, data as Premio]); setNombre(''); setProb(''); }
  }
  async function eliminar(id: string) {
    await supabase.from('premio_juego').delete().eq('id', id);
    setLista(lista.filter(p => p.id !== id));
  }

  return (
    <Card>
      <h3 className="mb-3 font-medium text-gray-900">{titulo}</h3>
      <form onSubmit={crear} className="flex items-end gap-2">
        <div className="flex-1"><Field label="Premio"><Input value={nombre} onChange={e => setNombre(e.target.value)} required /></Field></div>
        <div className="w-24"><Field label="Prob. %"><Input type="number" min={0} max={100} step="0.1" value={prob} onChange={e => setProb(e.target.value)} required /></Field></div>
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
              <span className="text-gray-800">{p.nombre}</span>
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
