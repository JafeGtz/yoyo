import { AppError } from '../errors/AppError';

/**
 * Resultado explícito de una operación que puede fallar.
 * Evita lanzar excepciones a través de las capas: el dominio y la UI
 * deciden qué hacer con el error sin try/catch dispersos.
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
