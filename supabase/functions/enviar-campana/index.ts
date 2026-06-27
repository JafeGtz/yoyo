// enviar-campana — envía una campaña a los clientes del negocio.
// HOY: crea notificaciones in-app (la app las lee de la tabla notificacion).
// PENDIENTE FCM: enviar push a los tokens de dispositivo_push (ver TODO).
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { campana_id } = await req.json();
    if (!campana_id) return json({ error: 'falta_campana_id' }, 400);

    const admin = adminClient();

    const { data: campana } = await admin
      .from('campana')
      .select('id, negocio_id, titulo, mensaje, segmento, estado')
      .eq('id', campana_id)
      .maybeSingle();
    if (!campana) return json({ error: 'campana_no_encontrada' }, 404);
    if (campana.estado === 'enviada') return json({ error: 'campana_ya_enviada' }, 409);

    // Debe ser miembro del negocio.
    const { data: miembro } = await admin
      .from('usuario_negocio')
      .select('id')
      .eq('auth_user_id', uid)
      .eq('negocio_id', campana.negocio_id)
      .eq('activo', true)
      .maybeSingle();
    if (!miembro) return json({ error: 'no_autorizado' }, 403);

    // Resolver el segmento -> lista de clientes.
    let q = admin
      .from('cliente_negocio')
      .select('cliente_id, ultima_visita')
      .eq('negocio_id', campana.negocio_id)
      .eq('bloqueado', false);

    const dias: Record<string, number> = { inactivos_7: 7, inactivos_14: 14, inactivos_30: 30 };
    if (dias[campana.segmento]) {
      const corte = new Date(Date.now() - dias[campana.segmento] * 86400000).toISOString();
      q = q.lt('ultima_visita', corte);
    }
    const { data: rels } = await q;
    const clientes = (rels ?? []).map(r => r.cliente_id);

    if (clientes.length === 0) {
      await admin.from('campana').update({ estado: 'enviada', enviados: 0 }).eq('id', campana.id);
      return json({ enviados: 0 });
    }

    // 1) Notificación in-app para cada cliente (funciona ya, sin Firebase).
    const notifs = clientes.map(cliente_id => ({
      cliente_id,
      tipo: 'campana',
      titulo: campana.titulo,
      cuerpo: campana.mensaje,
      data: { campana_id: campana.id },
    }));
    await admin.from('notificacion').insert(notifs);

    // 2) TODO FCM: cuando Firebase esté conectado, enviar push aquí.
    //    const { data: tokens } = await admin.from('dispositivo_push')
    //      .select('token').in('cliente_id', clientes);
    //    await enviarPushFCM(tokens, campana.titulo, campana.mensaje);

    await admin
      .from('campana')
      .update({ estado: 'enviada', enviados: clientes.length })
      .eq('id', campana.id);

    return json({ enviados: clientes.length });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
