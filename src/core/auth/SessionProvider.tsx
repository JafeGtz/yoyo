import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../data/supabase/supabaseClient';
import { obtenerPerfil, type Perfil } from './authService';

interface SessionState {
  session: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  recargarPerfil: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

const dormir = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Un intento de cargar el perfil.
 *  - Devuelve un Perfil (incluso {rol:null}) si la consulta tuvo ÉXITO.
 *  - Devuelve null si FALLÓ (red/token) -> caso transitorio, hay que reintentar.
 * Distinguir ambos es la clave para no mostrar "sin perfil" mientras el token
 * se refresca.
 */
async function intentarPerfil(): Promise<Perfil | null> {
  try {
    return await conTimeout(obtenerPerfil(), 6000);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  // Reintenta en silencio mientras el token se refresca. Solo marca rol:null
  // si tras agotar el tiempo no se pudo (problema real).
  const cargarPerfilConReintentos = useCallback(async (maxMs = 12000) => {
    const limite = Date.now() + maxMs;
    while (Date.now() < limite) {
      const p = await intentarPerfil();
      if (p) {
        setPerfil(p);
        return;
      }
      await dormir(800);
    }
    setPerfil({ rol: null });
  }, []);

  useEffect(() => {
    let activo = true;

    (async () => {
      let s: Session | null = null;
      try {
        s = (await conTimeout(supabase.auth.getSession(), 8000)).data.session;
      } catch {
        // sin sesión utilizable
      }
      if (!activo) return;
      setSession(s);
      if (s) await cargarPerfilConReintentos();
      if (activo) setCargando(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'INITIAL_SESSION') return; // lo maneja el bloque inicial
      setSession(s);
      if (!s) {
        setPerfil(null);
        return;
      }
      // Cambios posteriores (login, refresh de token): solo actualiza en ÉXITO,
      // nunca pone rol:null transitorio -> no parpadea la pantalla de error.
      intentarPerfil().then(p => {
        if (p) setPerfil(p);
      });
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [cargarPerfilConReintentos]);

  const recargarPerfil = useCallback(() => cargarPerfilConReintentos(6000), [cargarPerfilConReintentos]);

  return (
    <SessionContext.Provider value={{ session, perfil, cargando, recargarPerfil }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}
