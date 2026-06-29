import { useState } from 'react';
import { iniciarSesion, registrarConsumidor } from '../../../core/auth/authService';

export function useAuthViewModel() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<boolean> {
    setCargando(true);
    setError(null);
    try {
      await iniciarSesion(email, password);
      return true;
    } catch (e) {
      setError(mensaje(e, 'No se pudo iniciar sesión.'));
      return false;
    } finally {
      setCargando(false);
    }
  }

  async function registrar(params: {
    email: string;
    password: string;
    nombre: string;
    celular?: string;
    cumpleanos?: string;
  }): Promise<boolean> {
    setCargando(true);
    setError(null);
    try {
      await registrarConsumidor(params);
      return true;
    } catch (e) {
      setError(mensaje(e, 'No se pudo crear la cuenta.'));
      return false;
    } finally {
      setCargando(false);
    }
  }

  return { cargando, error, login, registrar };
}

function mensaje(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return fallback;
}
