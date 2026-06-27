import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { FichaClient } from './FichaClient';

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { negocio } = await getSesion();
  const supabase = await createClient();

  const { data: cn } = await supabase
    .from('cliente_negocio')
    .select(
      'id, cliente_id, visitas_totales, monto_acumulado, primera_visita, ultima_visita, bloqueado, notas, cliente:cliente_id(nombre, celular, cumpleanos), nivel:nivel_membresia_id(nombre)',
    )
    .eq('id', id)
    .eq('negocio_id', negocio!.id)
    .maybeSingle();

  if (!cn) notFound();

  const [{ data: beneficios }, { data: visitas }, { data: resenas }, { data: ajustes }] =
    await Promise.all([
      supabase
        .from('beneficio_desbloqueado')
        .select('id, estado, vence_en, beneficio:beneficio_id(nombre)')
        .eq('cliente_id', cn.cliente_id)
        .eq('negocio_id', negocio!.id)
        .order('desbloqueado_en', { ascending: false }),
      supabase
        .from('visita')
        .select('id, creado_en, monto')
        .eq('cliente_id', cn.cliente_id)
        .eq('negocio_id', negocio!.id)
        .order('creado_en', { ascending: false })
        .limit(20),
      supabase
        .from('resena')
        .select('id, estrellas, comentario, nps, creada_en')
        .eq('cliente_id', cn.cliente_id)
        .eq('negocio_id', negocio!.id)
        .order('creada_en', { ascending: false }),
      supabase
        .from('ajuste_visita')
        .select('id, delta, motivo, creado_en')
        .eq('cliente_negocio_id', cn.id)
        .order('creado_en', { ascending: false }),
    ]);

  const cliente = cn.cliente as unknown as { nombre: string; celular: string | null; cumpleanos: string | null };
  const nivel = cn.nivel as unknown as { nombre: string } | null;

  return (
    <div>
      <Link href="/clientes" className="text-sm text-indigo-600 hover:underline">← Clientes</Link>
      <FichaClient
        clienteNegocioId={cn.id}
        nombre={cliente?.nombre ?? '—'}
        celular={cliente?.celular ?? null}
        nivel={nivel?.nombre ?? null}
        visitasIniciales={cn.visitas_totales}
        montoAcumulado={Number(cn.monto_acumulado)}
        bloqueadoInicial={cn.bloqueado}
        notasIniciales={cn.notas ?? ''}
        beneficios={(beneficios as unknown as { id: string; estado: string; vence_en: string | null; beneficio: { nombre: string } | null }[]) ?? []}
        visitas={(visitas as { id: string; creado_en: string; monto: number | null }[]) ?? []}
        resenas={(resenas as { id: string; estrellas: number | null; comentario: string | null; nps: number | null; creada_en: string }[]) ?? []}
        ajustes={(ajustes as { id: string; delta: number; motivo: string | null; creado_en: string }[]) ?? []}
      />
    </div>
  );
}
