import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { Card, PageHeader } from '@/components/ui/Card';
import { TogglesSection } from './TogglesSection';
import { RetosSection } from './RetosSection';
import { RifasSection } from './RifasSection';
import { JuegoSection, type JuegoConfig } from './JuegoSection';
import { LogrosSection } from './LogrosSection';

export interface BeneficioOpcion { id: string; nombre: string }
export interface NivelOpcion { id: string; nombre: string; visitas_minimas: number }

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
    { data: beneficios },
    { data: niveles },
    { data: configs },
    { data: productos },
  ] = await Promise.all([
    supabase.from('negocio').select('config').eq('id', id).single(),
    supabase.from('reto').select('id, nombre, descripcion, activo, vence_en, beneficio_id, tipo, meta, catalogo_item_id').eq('negocio_id', id).order('creado_en', { ascending: false }),
    supabase.from('rifa').select('id, nombre, premio, cierra_en, estado, beneficio_id, criterio').eq('negocio_id', id).order('creado_en', { ascending: false }),
    supabase.from('premio_juego').select('id, juego, nombre, probabilidad, activo, beneficio_id').eq('negocio_id', id),
    supabase.from('logro').select('id, nombre, descripcion').eq('ambito', 'global').order('creado_en'),
    supabase.from('logro').select('id, nombre, descripcion, condicion').eq('negocio_id', id).order('creado_en', { ascending: false }),
    supabase.from('beneficio').select('id, nombre').eq('negocio_id', id).eq('estado', 'activo').order('nombre'),
    supabase.from('nivel_membresia').select('id, nombre, visitas_minimas').eq('negocio_id', id).order('visitas_minimas'),
    supabase.from('juego_config').select('juego, nivel_membresia_id, giros_max_dia').eq('negocio_id', id),
    supabase.from('catalogo_item').select('id, nombre').eq('negocio_id', id).order('orden'),
  ]);

  const premiosRuleta = (premios ?? []).filter((p: { juego: string }) => p.juego === 'ruleta');
  const premiosRasca = (premios ?? []).filter((p: { juego: string }) => p.juego === 'rasca');
  const bens = (beneficios as { id: string; nombre: string }[]) ?? [];
  const nivs = (niveles as { id: string; nombre: string; visitas_minimas: number }[]) ?? [];
  const cfgDe = (juego: string): JuegoConfig | undefined =>
    (configs as JuegoConfig[] ?? []).find(c => c.juego === juego);

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
        <RetosSection negocioId={id} inicial={retos ?? []} beneficios={bens} productos={(productos as { id: string; nombre: string }[]) ?? []} />
        <RifasSection negocioId={id} inicial={rifas ?? []} beneficios={bens} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <JuegoSection negocioId={id} juego="ruleta" titulo='Ruleta "Gira y Gana"' inicial={premiosRuleta} beneficios={bens} niveles={nivs} config={cfgDe('ruleta')} />
          <JuegoSection negocioId={id} juego="rasca" titulo="Rasca y gana" inicial={premiosRasca} beneficios={bens} niveles={nivs} config={cfgDe('rasca')} />
        </div>
        <LogrosSection negocioId={id} globales={logrosGlobales ?? []} inicial={logrosNegocio ?? []} />
      </div>
    </div>
  );
}
