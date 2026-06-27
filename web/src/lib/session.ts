import { createClient } from './supabase/server';

export interface NegocioSesion {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
}

/**
 * Devuelve el usuario autenticado y su negocio (si es dueño/personal).
 * Es la base del guard del área privada y de la detección de rol.
 */
export async function getSesion(): Promise<{
  userId: string | null;
  negocio: NegocioSesion | null;
  rol: 'dueno' | 'personal' | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, negocio: null, rol: null };

  const { data } = await supabase
    .from('usuario_negocio')
    .select('rol, negocio:negocio_id(id, nombre, tipo, estado)')
    .eq('auth_user_id', user.id)
    .eq('activo', true)
    .maybeSingle();

  const negocio = (data?.negocio as unknown as NegocioSesion) ?? null;
  return { userId: user.id, negocio, rol: (data?.rol as 'dueno' | 'personal') ?? null };
}
