'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

const ITEM_H = 80; // alto de cada nombre en el reel (px)

interface RifaLive { id: string; nombre: string; premio: string | null; minVisitas: number }

export function SorteoEnVivo({
  negocioId, rifa, onClose, onSorteada,
}: {
  negocioId: string;
  rifa: RifaLive;
  onClose: () => void;
  onSorteada: (ganador: string) => void;
}) {
  const supabase = createClient();
  const [participantes, setParticipantes] = useState<string[] | null>(null);
  const [fase, setFase] = useState<'listo' | 'girando' | 'ganador'>('listo');
  const [ganador, setGanador] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState('');
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from('cliente_negocio')
        .select('visitas_totales, cliente:cliente_id(nombre)')
        .eq('negocio_id', negocioId).eq('bloqueado', false)
        .gte('visitas_totales', rifa.minVisitas);
      if (!vivo) return;
      const nombres = (data as unknown as { cliente: { nombre: string } | null }[] ?? [])
        .map(r => r.cliente?.nombre).filter((n): n is string => !!n);
      setParticipantes(nombres);
    })();
    return () => { vivo = false; };
  }, [negocioId, rifa.minVisitas]);

  async function sortear() {
    if (!participantes || participantes.length === 0) return;
    setFase('girando');
    setError('');

    const { data, error: e } = await supabase.rpc('sortear_rifa', { p_rifa_id: rifa.id });
    if (e || !data) {
      setError(e?.message ?? 'No se pudo sortear.');
      setFase('listo');
      return;
    }
    const nombreGanador = data as string;

    // Construye el reel: relleno aleatorio y el ganador cerca del final.
    const N = 45;
    const reel: string[] = Array.from({ length: N }, () => participantes[Math.floor(Math.random() * participantes.length)]);
    const target = N - 5;
    reel[target] = nombreGanador;
    setItems(reel);
    setGanador(nombreGanador);
    // La animación (anime.js) la dispara el useEffect cuando el reel ya está en el DOM.
  }

  // Anima el reel con anime.js: frena suavemente en el ganador (ease-out fuerte).
  useEffect(() => {
    if (fase !== 'girando' || items.length === 0 || !reelRef.current) return;
    const target = items.length - 5;
    const anim = animate(reelRef.current, {
      translateY: [0, -(target * ITEM_H)],
      duration: 4600,
      ease: 'outExpo',
      onComplete: () => { void alTerminar(); },
    });
    return () => { anim.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, fase]);

  async function alTerminar() {
    if (fase !== 'girando') return;
    setFase('ganador');
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.4 } });
      setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.5 } }), 400);
    } catch { /* sin confeti si falla */ }
  }

  function cerrar() {
    if (ganador) onSorteada(ganador);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 p-6 text-center text-white">
      <button onClick={cerrar} className="absolute right-6 top-6 text-2xl text-gray-400 hover:text-white">×</button>

      <p className="text-sm uppercase tracking-widest text-indigo-300">Sorteo en vivo</p>
      <h2 className="mt-1 text-3xl font-bold">{rifa.nombre}</h2>
      {rifa.premio && <p className="mt-1 text-lg text-indigo-200">🎁 {rifa.premio}</p>}
      <p className="mt-2 text-sm text-gray-400">
        {participantes === null ? 'Cargando participantes…' : `${participantes.length} participante${participantes.length === 1 ? '' : 's'}`}
      </p>

      {/* Reel */}
      <div className="relative my-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5" style={{ height: ITEM_H }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-gray-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-gray-950 to-transparent" />
        {items.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: ITEM_H }}>
            <span className="text-2xl font-semibold text-gray-500">
              {fase === 'ganador' && ganador ? ganador : '¿Quién ganará?'}
            </span>
          </div>
        ) : (
          <div ref={reelRef}>
            {items.map((n, i) => (
              <div key={i} className="flex items-center justify-center font-semibold" style={{ height: ITEM_H, fontSize: 26 }}>
                {n}
              </div>
            ))}
          </div>
        )}
      </div>

      {fase === 'ganador' && ganador && (
        <div className="mb-6">
          <p className="text-lg text-gray-300">🎉 ¡Ganador!</p>
          <p className="text-4xl font-extrabold text-white">{ganador}</p>
          <p className="mt-2 text-sm text-indigo-200">Ya recibió su premio en la app.</p>
        </div>
      )}

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {fase === 'ganador' ? (
        <Button onClick={cerrar}>Cerrar</Button>
      ) : (
        <button
          onClick={sortear}
          disabled={fase === 'girando' || !participantes || participantes.length === 0}
          className="rounded-xl bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-indigo-500 disabled:opacity-40"
        >
          {fase === 'girando' ? 'Sorteando…' : participantes && participantes.length === 0 ? 'Sin participantes' : 'SORTEAR'}
        </button>
      )}
    </div>
  );
}
