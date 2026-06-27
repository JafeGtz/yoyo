/**
 * Configuración de entorno.
 *
 * En producción estos valores se inyectan desde variables de entorno
 * (react-native-config / .env) y NUNCA se hardcodean ni se commitean.
 * La anon key de Supabase es pública por diseño; el acceso se protege
 * con Row Level Security (RLS), no ocultándola.
 */
export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Usa repositorios mock en vez de Supabase (desarrollo sin backend). */
  useMockData: boolean;
}

// Proyecto Supabase "yoyo" (us-east-2). La anon key es pública por diseño
// (protegida por RLS). La service_role key y la contraseña de la BD son
// secretas y NO van aquí ni en la app.
// TODO: mover a variables de entorno (react-native-config) antes de release.
export const env: AppEnv = {
  supabaseUrl: 'https://gtqfomzmpypmlbiaygme.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cWZvbXptcHlwbWxiaWF5Z21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MzAyNDksImV4cCI6MjA5ODAwNjI0OX0.xqXgf1ZETDyfq_CMCZWIMw-C4qXHFR2MTuFS0ZmDVE8',
  // Sigue en true: el repositorio Supabase aún es un stub. Cambiar a false
  // cuando NegocioRepositorySupabase esté implementado (necesita el cliente
  // @supabase/supabase-js — ver supabase/README.md).
  useMockData: true,
};
