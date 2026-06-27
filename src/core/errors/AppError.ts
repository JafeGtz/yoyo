export type AppErrorCode =
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNKNOWN';

/**
 * Error de dominio normalizado. Las capas de datos traducen errores
 * de Supabase/red a un AppError para que la UI no dependa del backend.
 */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unknown(cause?: unknown): AppError {
    return new AppError('UNKNOWN', 'Ocurrió un error inesperado.', cause);
  }
}
