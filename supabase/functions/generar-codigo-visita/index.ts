// generar-codigo-visita — el personal genera un código de un solo uso (o N
// usos) para que el cliente registre su visita. Vive 5 minutos.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';

const TTL_SEGUNDOS = 300; // 5 minutos

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { negocio_id, usos_max } = await req.json();
    if (!negocio_id) return json({ error: 'falta_negocio_id' }, 400);

    const admin = adminClient();

    // Debe ser personal/dueño activo del negocio.
    const { data: miembro } = await admin
      .from('usuario_negocio')
      .select('id')
      .eq('auth_user_id', uid)
      .eq('negocio_id', negocio_id)
      .eq('activo', true)
      .maybeSingle();
    if (!miembro) return json({ error: 'no_autorizado' }, 403);

    const ahora = new Date().toISOString();

    // Código de 4 dígitos, único entre los activos del negocio.
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo = String(Math.floor(1000 + Math.random() * 9000));
      const { data: existe } = await admin
        .from('codigo_visita')
        .select('id')
        .eq('negocio_id', negocio_id)
        .eq('codigo', codigo)
        .gt('expira_en', ahora)
        .maybeSingle();
      if (!existe) break;
    }

    const expira = new Date(Date.now() + TTL_SEGUNDOS * 1000).toISOString();
    const usos = Number.isInteger(usos_max) && usos_max > 0 ? usos_max : 1;

    const { error } = await admin.from('codigo_visita').insert({
      negocio_id,
      codigo,
      usos_max: usos,
      expira_en: expira,
      creado_por: miembro.id,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ codigo, usos_max: usos, expira_en_segundos: TTL_SEGUNDOS });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
