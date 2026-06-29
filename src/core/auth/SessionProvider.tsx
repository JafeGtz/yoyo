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

// Evita que una llamada colgada (red lenta/token expirado) deje la app
// atorada en el spinner: si tarda demasiado, rechaza y seguimos.
function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setPerfil(null);
      return;
    }
    try {
      setPerfil(await conTimeout(obtenerPerfil(), 8000));
    } catch {
      setPerfil({ rol: null });
    }
  }, []);

  useEffect(() => {
    let activo = true;

    // Al iniciar con token expirado, el perfil puede fallar el primer intento
    // mientras el token se refresca. Reintenta en silencio (mostrando el
    // spinner, no el error) para ir directo al Home sin parpadeo.
    async function cargarConReintentos(s: Session | null) {
      if (!s) {
        setPerfil(null);
        return;
      }
      for (let i = 0; i < 3; i++) {
        try {
          const p = await conTimeout(obtenerPerfil(), 6000);
          if (!activo) return;
          if (p.rol) {
            setPerfil(p);
            return;
          }
        } catch {
          // reintentar
        }
        await new Promise(r => setTimeout(r, 800));
      }
      if (activo) setPerfil({ rol: null });
    }

    (async () => {
      try {
        const { data } = await conTimeout(supabase.auth.getSession(), 8000);
        if (!activo) return;
        setSession(data.session);
        await cargarConReintentos(data.session);
      } catch {
        // Si falla, dejamos sesión en null -> pantalla de login.
      } finally {
        if (activo) setCargando(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await cargarPerfil(s);
    });
    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  // Recarga el perfil usando la sesión actual del cliente Supabase.
  const recargarPerfil = useCallback(async () => {
    try {
      setPerfil(await conTimeout(obtenerPerfil(), 8000));
    } catch {
      setPerfil({ rol: null });
    }
  }, []);

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
