import { env } from '../config/env';
import { NegocioRepository } from '../../domain/repositories/NegocioRepository';
import { NegocioRepositoryMock } from '../../data/repositories/NegocioRepositoryMock';
import { NegocioRepositorySupabase } from '../../data/repositories/NegocioRepositorySupabase';
import { ObtenerMisNegocios } from '../../domain/usecases/ObtenerMisNegocios';

/**
 * Contenedor de dependencias (composición). Es el único lugar que conoce
 * las implementaciones concretas: aquí se decide mock vs Supabase y se
 * arman los casos de uso. La UI consume `container`, no los repositorios.
 */
const negocioRepository: NegocioRepository = env.useMockData
  ? new NegocioRepositoryMock()
  : new NegocioRepositorySupabase();

export const container = {
  usecases: {
    obtenerMisNegocios: new ObtenerMisNegocios(negocioRepository),
  },
} as const;
