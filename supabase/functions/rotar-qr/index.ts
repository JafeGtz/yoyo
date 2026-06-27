// rotar-qr — genera/rota el QR firmado de un negocio.
// Lo llama el dueño desde la web (o un cron en modo masivo, futuro).
// El cliente NO genera QR: solo lo escanea.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';
import { signToken } from '../_shared/token.ts';

const TTL_SEGUNDOS = 60 * 60 * 24; // 24 h

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { negocio_id } = await req.json();
    if (!negocio_id) return json({ error: 'falta_negocio_id' }, 400);

    const admin = adminClient();

    // El que llama debe ser miembro activo del negocio.
    const { data: miembro } = await admin
      .from('usuario_negocio')
      .select('id')
      .eq('auth_user_id', uid)
      .eq('negocio_id', negocio_id)
      .eq('activo', true)
      .maybeSingle();
    if (!miembro) return json({ error: 'no_autorizado' }, 403);

    const secret = Deno.env.get('QR_SIGNING_SECRET')!;
    const token = await signToken({ negocio_id }, secret, TTL_SEGUNDOS);
    const codigoRespaldo = String(Math.floor(100000 + Math.random() * 900000));
    const expiraEn = new Date(Date.now() + TTL_SEGUNDOS * 1000).toISOString();

    // Desactivar el QR activo anterior y crear el nuevo.
    await admin.from('negocio_qr').update({ activo: false })
      .eq('negocio_id', negocio_id).eq('activo', true);

    const { error } = await admin.from('negocio_qr').insert({
      negocio_id,
      token,
      codigo_respaldo: codigoRespaldo,
      activo: true,
      expira_en: expiraEn,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ token, codigo_respaldo: codigoRespaldo, expira_en: expiraEn });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
