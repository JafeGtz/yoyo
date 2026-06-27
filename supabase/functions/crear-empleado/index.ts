// crear-empleado — el dueño da de alta a un empleado.
// Crea el usuario de auth (confirmado) y lo liga al negocio como 'personal'.
// Solo lo puede llamar un DUEÑO del negocio.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { negocio_id, email, password, nombre } = await req.json();
    if (!negocio_id || !email || !password) {
      return json({ error: 'faltan_datos' }, 400);
    }

    const admin = adminClient();

    // Solo un dueño del negocio puede dar de alta personal.
    const { data: dueno } = await admin
      .from('usuario_negocio')
      .select('id')
      .eq('auth_user_id', uid)
      .eq('negocio_id', negocio_id)
      .eq('rol', 'dueno')
      .eq('activo', true)
      .maybeSingle();
    if (!dueno) return json({ error: 'no_autorizado' }, 403);

    // Crear el usuario de auth (confirmado, sin correo de verificación).
    const { data: creado, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr || !creado.user) {
      return json({ error: authErr?.message ?? 'no_se_pudo_crear_usuario' }, 400);
    }

    // Ligar al negocio como personal.
    const { error: unErr } = await admin.from('usuario_negocio').insert({
      auth_user_id: creado.user.id,
      negocio_id,
      rol: 'personal',
      nombre: nombre ?? null,
    });
    if (unErr) {
      // Limpieza: si falla el vínculo, borrar el usuario recién creado.
      await admin.auth.admin.deleteUser(creado.user.id);
      return json({ error: unErr.message }, 400);
    }

    return json({ ok: true, email });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
