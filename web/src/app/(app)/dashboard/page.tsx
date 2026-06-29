import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { Card, PageHeader } from '@/components/ui/Card';
import { VisitasChart, TopBeneficiosChart } from './DashboardCharts';
import { PortadaUploader } from './PortadaUploader';

const diaKey = (d: Date) => d.toISOString().slice(0, 10);
const diaCorto = (s: string) => s.slice(5); // MM-DD

export default async function DashboardPage() {
  const { negocio } = await getSesion();
  const negocioId = negocio!.id;
  const supabase = await createClient();

  const ahora = new Date();
  const hace14 = new Date(ahora.getTime() - 14 * 86400000);
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const hace7 = new Date(ahora.getTime() - 7 * 86400000);
  const hace30 = new Date(ahora.getTime() - 30 * 86400000);

  const [
    { count: clientes },
    { count: beneficiosActivos },
    { data: visitas },
    { data: canjeados },
    { data: benefCond },
    { data: relVisitas },
    { data: resenas },
    { data: neg },
  ] = await Promise.all([
    supabase.from('cliente_negocio').select('id', { count: 'exact', head: true }).eq('negocio_id', negocioId),
    supabase.from('beneficio').select('id', { count: 'exact', head: true }).eq('negocio_id', negocioId).eq('estado', 'activo'),
    supabase.from('visita').select('creado_en, monto').eq('negocio_id', negocioId).gt('creado_en', hace14.toISOString()),
    supabase.from('beneficio_desbloqueado').select('beneficio:beneficio_id(nombre)').eq('negocio_id', negocioId).eq('estado', 'canjeado'),
    supabase.from('beneficio').select('nombre, condicion_visitas').eq('negocio_id', negocioId).eq('estado', 'activo').not('condicion_visitas', 'is', null),
    supabase.from('cliente_negocio').select('visitas_totales').eq('negocio_id', negocioId),
    supabase.from('resena').select('estrellas, nps').eq('negocio_id', negocioId),
    supabase.from('negocio').select('modelo_acumulacion, portada_url').eq('id', negocioId).single(),
  ]);

  const v = (visitas as { creado_en: string; monto: number | null }[]) ?? [];

  // KPIs por periodo
  const visitasHoy = v.filter(x => new Date(x.creado_en) >= inicioHoy).length;
  const visitasSemana = v.filter(x => new Date(x.creado_en) >= hace7).length;
  const visitasMes = v.filter(x => new Date(x.creado_en) >= hace30).length;

  // Serie diaria (14 días)
  const serie: { dia: string; visitas: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ahora.getTime() - i * 86400000);
    const k = diaKey(d);
    serie.push({ dia: diaCorto(k), visitas: v.filter(x => x.creado_en.slice(0, 10) === k).length });
  }

  // Top beneficios canjeados
  const conteo = new Map<string, number>();
  for (const c of (canjeados as unknown as { beneficio: { nombre: string } | null }[]) ?? []) {
    const n = c.beneficio?.nombre ?? '—';
    conteo.set(n, (conteo.get(n) ?? 0) + 1);
  }
  const topBeneficios = [...conteo.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Alertas inteligentes: clientes a 1-2 visitas de desbloquear
  const totales = ((relVisitas as { visitas_totales: number }[]) ?? []).map(r => r.visitas_totales);
  const alertas: { texto: string }[] = [];
  for (const b of (benefCond as { nombre: string; condicion_visitas: number }[]) ?? []) {
    const cerca = totales.filter(t => b.condicion_visitas - t >= 1 && b.condicion_visitas - t <= 2).length;
    if (cerca > 0) alertas.push({ texto: `${cerca} cliente(s) a 1-2 visitas de desbloquear "${b.nombre}".` });
  }

  // Resumen de reseñas / NPS
  const rs = (resenas as { estrellas: number | null; nps: number | null }[]) ?? [];
  const conEstrellas = rs.filter(r => r.estrellas != null);
  const promedio = conEstrellas.length ? conEstrellas.reduce((s, r) => s + (r.estrellas ?? 0), 0) / conEstrellas.length : 0;
  const conNps = rs.filter(r => r.nps != null);
  const prom = conNps.filter(r => (r.nps ?? 0) >= 9).length;
  const det = conNps.filter(r => (r.nps ?? 0) <= 6).length;
  const nps = conNps.length ? Math.round(((prom - det) / conNps.length) * 100) : null;

  // Modelo Plus
  const esPlus = neg?.modelo_acumulacion === 'plus';
  const montos = v.map(x => x.monto).filter((m): m is number => m != null);
  const ticketProm = montos.length ? montos.reduce((s, m) => s + m, 0) / montos.length : 0;

  const kpis = [
    { label: 'Clientes', valor: clientes ?? 0 },
    { label: 'Visitas hoy', valor: visitasHoy },
    { label: 'Visitas (7 días)', valor: visitasSemana },
    { label: 'Beneficios activos', valor: beneficiosActivos ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description={`Resumen de ${negocio!.nombre}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{k.valor}</div>
          </Card>
        ))}
      </div>

      {alertas.length > 0 && (
        <div className="mt-4 space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚡ {a.texto} Prepárate.
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VisitasChart data={serie} />
        <TopBeneficiosChart data={topBeneficios} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Calificación promedio</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {promedio ? promedio.toFixed(1) : '—'} <span className="text-yellow-500">★</span>
          </div>
          <div className="text-xs text-gray-400">{conEstrellas.length} reseñas</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">NPS</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{nps ?? '—'}</div>
          <div className="text-xs text-gray-400">{conNps.length} respuestas</div>
        </Card>
        {esPlus ? (
          <Card>
            <div className="text-sm text-gray-500">Ticket promedio</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">${ticketProm.toFixed(0)}</div>
            <div className="text-xs text-gray-400">últimos 14 días</div>
          </Card>
        ) : (
          <Card>
            <div className="text-sm text-gray-500">Visitas (30 días)</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{visitasMes}</div>
          </Card>
        )}
      </div>

      <div className="mt-4">
        <PortadaUploader negocioId={negocioId} inicial={(neg as { portada_url: string | null } | null)?.portada_url ?? null} />
      </div>
    </div>
  );
}
