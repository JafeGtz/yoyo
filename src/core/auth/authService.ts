import { supabase } from '../../data/supabase/supabaseClient';

/** Rol y datos del usuario autenticado (devuelto por el RPC mi_perfil). */
export interface Perfil {
  rol: 'consumidor' | 'personal' | 'dueno' | 'admin' | null;
  cliente_id?: string;
  negocio_id?: string;
  nombre?: string;
  foto_url?: string | null;
}

export async function registrarConsumidor(params: {
  email: string;
  password: string;
  nombre: string;
  celular?: string;
  cumpleanos?: string;
}): Promise<void> {
  const { email, password, nombre, celular, cumpleanos } = params;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('No se pudo crear el usuario.');

  // Crear la fila cliente (RLS permite el alta propia).
  const { error: cliErr } = await supabase.from('cliente').insert({
    auth_user_id: data.user.id,
    nombre,
    celular: celular || null,
    cumpleanos: cumpleanos || null,
  });
  if (cliErr) throw cliErr;
}

export async function iniciarSesion(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerPerfil(): Promise<Perfil> {
  const { data, error } = await supabase.rpc('mi_perfil');
  if (error) throw error;
  return (data as Perfil) ?? { rol: null };
}
