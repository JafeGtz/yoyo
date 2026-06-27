import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { Card, PageHeader } from '@/components/ui/Card';
import { TogglesSection } from './TogglesSection';
import { RetosSection } from './RetosSection';
import { RifasSection } from './RifasSection';
import { JuegoSection } from './JuegoSection';
import { LogrosSection } from './LogrosSection';

export default async function GamificacionPage() {
  const { negocio } = await getSesion();
  const id = negocio!.id;
  const supabase = await createClient();

  const [
    { data: neg },
    { data: retos },
    { data: rifas },
    { data: premios },
    { data: logrosGlobales },
    { data: logrosNegocio },
  ] = await Promise.all([
    supabase.from('negocio').select('config').eq('id', id).single(),
    supabase.from('reto').select('id, nombre, descripcion, activo, vence_en').eq('negocio_id', id).order('creado_en', { ascending: false }),
    supabase.from('rifa').select('id, nombre, premio, cierra_en, estado').eq('negocio_id', id).order('creado_en', { ascending: false }),
    supabase.from('premio_juego').select('id, juego, nombre, probabilidad, activo').eq('negocio_id', id),
    supabase.from('logro').select('id, nombre, descripcion').eq('ambito', 'global').order('creado_en'),
    supabase.from('logro').select('id, nombre, descripcion').eq('negocio_id', id).order('creado_en', { ascending: false }),
  ]);

  const premiosRuleta = (premios ?? []).filter((p: { juego: string }) => p.juego === 'ruleta');
  const premiosRasca = (premios ?? []).filter((p: { juego: string }) => p.juego === 'rasca');

  // Leaderboard del mes en curso.
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const { data: ranking } = await supabase.rpc('ranking_negocio', { p_negocio_id: id, p_desde: inicioMes });
  const top = (ranking as { nombre: string; visitas: number }[]) ?? [];

  return (
    <div>
      <PageHeader title="Gamificación" description="Retos, rifas, juegos e insignias para enganchar a tus clientes." />
      <div className="space-y-6">
        <TogglesSection negocioId={id} config={(neg?.config as Record<string, boolean>) ?? {}} />

        <Card>
          <h3 className="mb-3 font-medium text-gray-900">Top clientes del mes</h3>
          {top.length === 0 ? (
            <p className="text-sm text-gray-400">Sin visitas este mes todavía.</p>
          ) : (
            <ol className="space-y-1">
              {top.map((t, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-800">{i + 1}. {t.nombre}</span>
                  <span className="text-gray-500">{t.visitas} visitas</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <RetosSection negocioId={id} inicial={retos ?? []} />
        <RifasSection negocioId={id} inicial={rifas ?? []} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <JuegoSection negocioId={id} juego="ruleta" titulo='Ruleta "Gira y Gana"' inicial={premiosRuleta} />
          <JuegoSection negocioId={id} juego="rasca" titulo="Rasca y gana" inicial={premiosRasca} />
        </div>
        <LogrosSection negocioId={id} globales={logrosGlobales ?? []} inicial={logrosNegocio ?? []} />
      </div>
    </div>
  );
}
