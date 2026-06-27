import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Cliente con privilegios totales (service_role). Ignora RLS. Solo servidor. */
export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

/**
 * Identifica al usuario autenticado a partir del JWT del request.
 * Devuelve su auth user id, o null si no hay sesión válida.
 */
export async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
  const { data, error } = await supa.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
