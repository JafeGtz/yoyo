import { AppError } from '../../core/errors/AppError';
import { err, ok, Result } from '../../core/result/Result';
import { ProgresoNegocio } from '../../domain/entities/ProgresoNegocio';
import { NegocioRepository } from '../../domain/repositories/NegocioRepository';
import { supabase } from '../supabase/supabaseClient';

interface FilaCN {
  visitas_totales: number;
  negocio: { id: string; nombre: string; tipo: string; modelo_acumulacion: string } | null;
  nivel: { nombre: string } | null;
}

/** Implementación real contra Supabase (protegida por RLS). */
export class NegocioRepositorySupabase implements NegocioRepository {
  async obtenerMisNegocios(clienteId: string): Promise<Result<ProgresoNegocio[]>> {
    const { data, error } = await supabase
      .from('cliente_negocio')
      .select(
        'visitas_totales, negocio:negocio_id(id, nombre, tipo, modelo_acumulacion), nivel:nivel_membresia_id(nombre)',
      )
      .eq('cliente_id', clienteId);

    if (error) return err(new AppError('UNKNOWN', error.message, error));

    const filas = (data as unknown as FilaCN[]).filter(f => f.negocio);
    const negocioIds = filas.map(f => f.negocio!.id);

    // Próximo beneficio por negocio (siguiente umbral no alcanzado) + umbral previo.
    const proximos = new Map<string, { nombre: string; faltan: number }>();
    const desdePorNegocio = new Map<string, number>();
    const hitosPorNegocio = new Map<string, number[]>();
    if (negocioIds.length > 0) {
      const { data: benes } = await supabase
        .from('beneficio')
        .select('negocio_id, nombre, condicion_visitas')
        .in('negocio_id', negocioIds)
        .eq('estado', 'activo')
        .not('condicion_visitas', 'is', null);

      for (const f of filas) {
        const delNegocio = (benes ?? []).filter(b => b.negocio_id === f.negocio!.id);
        hitosPorNegocio.set(f.negocio!.id, delNegocio.map(b => b.condicion_visitas!));
        const candidatos = delNegocio
          .filter(b => b.condicion_visitas! > f.visitas_totales)
          .sort((a, b) => a.condicion_visitas! - b.condicion_visitas!);
        if (candidatos[0]) {
          proximos.set(f.negocio!.id, {
            nombre: candidatos[0].nombre,
            faltan: candidatos[0].condicion_visitas! - f.visitas_totales,
          });
        }
        // Umbral previo = mayor condición ya alcanzada (o 0).
        const alcanzados = delNegocio
          .filter(b => b.condicion_visitas! <= f.visitas_totales)
          .map(b => b.condicion_visitas!);
        desdePorNegocio.set(f.negocio!.id, alcanzados.length ? Math.max(...alcanzados) : 0);
      }
    }

    const progreso: ProgresoNegocio[] = filas.map(f => {
      const prox = proximos.get(f.negocio!.id);
      return {
        negocio: {
          id: f.negocio!.id,
          nombre: f.negocio!.nombre,
          tipo: f.negocio!.tipo,
          modeloAcumulacion: f.negocio!.modelo_acumulacion === 'plus' ? 'plus' : 'basico',
        },
        visitasTotales: f.visitas_totales,
        nivelActual: f.nivel?.nombre ?? 'Sin nivel',
        proximoBeneficio: prox?.nombre,
        visitasParaProximoBeneficio: prox?.faltan,
        desdeVisitas: desdePorNegocio.get(f.negocio!.id) ?? 0,
        hitos: hitosPorNegocio.get(f.negocio!.id) ?? [],
      };
    });

    return ok(progreso);
  }
}
