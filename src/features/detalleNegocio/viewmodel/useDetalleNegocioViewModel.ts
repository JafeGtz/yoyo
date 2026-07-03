import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../data/supabase/supabaseClient';

export interface DetalleNegocio {
  negocio: {
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string | null;
    direccion: string | null;
    telefono: string | null;
    logo_url: string | null;
    lat: number | null;
    lng: number | null;
    citas_modo: 'desactivado' | 'solicitud' | 'agenda';
  };
  visitasTotales: number;
  montoAcumulado: number;
  nivel: string;
  beneficios: { id: string; nombre: string; vence_en: string | null }[];
  visitas: { id: string; creado_en: string; monto: number | null }[];
  catalogo: { id: string; nombre: string; descripcion: string | null; precio: number | null }[];
  ranking: { cliente_id: string; nombre: string; visitas: number }[];
  tieneRuleta: boolean;
  tieneRasca: boolean;
}

type UiState =
  | { status: 'cargando' }
  | { status: 'error'; mensaje: string }
  | { status: 'listo'; data: DetalleNegocio };

export function useDetalleNegocioViewModel(negocioId: string, clienteId: string) {
  const [state, setState] = useState<UiState>({ status: 'cargando' });

  const cargar = useCallback(async () => {
    setState({ status: 'cargando' });

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

    const [neg, cn, bens, vis, cat, rank, ruleta, rasca] = await Promise.all([
      supabase.from('negocio').select('id, nombre, tipo, descripcion, direccion, telefono, logo_url, lat, lng, citas_modo').eq('id', negocioId).single(),
      supabase.from('cliente_negocio').select('visitas_totales, monto_acumulado, nivel:nivel_membresia_id(nombre)').eq('negocio_id', negocioId).eq('cliente_id', clienteId).maybeSingle(),
      supabase.from('beneficio_desbloqueado').select('id, vence_en, beneficio:beneficio_id(nombre)').eq('negocio_id', negocioId).eq('cliente_id', clienteId).eq('estado', 'disponible'),
      supabase.from('visita').select('id, creado_en, monto').eq('negocio_id', negocioId).eq('cliente_id', clienteId).order('creado_en', { ascending: false }).limit(10),
      supabase.from('catalogo_item').select('id, nombre, descripcion, precio').eq('negocio_id', negocioId).order('orden'),
      supabase.rpc('ranking_negocio', { p_negocio_id: negocioId, p_desde: inicioMes }),
      supabase.from('premio_juego').select('id', { count: 'exact', head: true }).eq('negocio_id', negocioId).eq('juego', 'ruleta').eq('activo', true),
      supabase.from('premio_juego').select('id', { count: 'exact', head: true }).eq('negocio_id', negocioId).eq('juego', 'rasca').eq('activo', true),
    ]);

    if (neg.error || !neg.data) {
      setState({ status: 'error', mensaje: neg.error?.message ?? 'Negocio no encontrado.' });
      return;
    }

    const cnData = cn.data as { visitas_totales: number; monto_acumulado: number; nivel: { nombre: string } | null } | null;
    const bensData = (bens.data as unknown as { id: string; vence_en: string | null; beneficio: { nombre: string } | null }[]) ?? [];

    setState({
      status: 'listo',
      data: {
        negocio: neg.data,
        visitasTotales: cnData?.visitas_totales ?? 0,
        montoAcumulado: Number(cnData?.monto_acumulado ?? 0),
        nivel: cnData?.nivel?.nombre ?? 'Sin nivel',
        beneficios: bensData.map(b => ({ id: b.id, nombre: b.beneficio?.nombre ?? '—', vence_en: b.vence_en })),
        visitas: (vis.data as { id: string; creado_en: string; monto: number | null }[]) ?? [],
        catalogo: (cat.data as { id: string; nombre: string; descripcion: string | null; precio: number | null }[]) ?? [],
        ranking: (rank.data as { cliente_id: string; nombre: string; visitas: number }[]) ?? [],
        tieneRuleta: (ruleta.count ?? 0) > 0,
        tieneRasca: (rasca.count ?? 0) > 0,
      },
    });
  }, [negocioId, clienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { state, recargar: cargar };
}
