// canjear-beneficio — el personal escanea el código temporal del cliente.
// Valida el token, confirma que el beneficio sigue disponible, lo marca como
// canjeado y registra el canje con el empleado que lo validó (auditoría).
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';
import { verifyToken } from '../_shared/token.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { codigo } = await req.json();
    if (!codigo) return json({ error: 'falta_codigo' }, 400);

    const admin = adminClient();

    // 1) Verificar el token del cliente.
    let bdId: string;
    let jti: string;
    try {
      const payload = await verifyToken(codigo, Deno.env.get('QR_SIGNING_SECRET')!);
      bdId = payload.bd_id;
      jti = payload.jti;
    } catch (e) {
      return json({ error: 'codigo_invalido', detalle: String(e?.message ?? e) }, 400);
    }

    // 2) Cargar el beneficio desbloqueado + su negocio.
    const { data: bd } = await admin
      .from('beneficio_desbloqueado')
      .select('id, estado, negocio_id, cliente_id, beneficio_id, vence_en')
      .eq('id', bdId).maybeSingle();
    if (!bd) return json({ error: 'beneficio_no_encontrado' }, 404);
    if (bd.estado !== 'disponible') return json({ error: 'beneficio_no_disponible', estado: bd.estado }, 409);
    if (bd.vence_en && new Date(bd.vence_en) < new Date()) return json({ error: 'beneficio_vencido' }, 409);

    // 3) El que canjea debe ser personal/dueño activo de ESE negocio.
    const { data: miembro } = await admin
      .from('usuario_negocio')
      .select('id')
      .eq('auth_user_id', uid)
      .eq('negocio_id', bd.negocio_id)
      .eq('activo', true)
      .maybeSingle();
    if (!miembro) return json({ error: 'no_autorizado' }, 403);

    // Beneficio (incluye costo, que se congela en el canje — Hueco 4).
    const { data: beneficio } = await admin
      .from('beneficio').select('nombre, tipo, valor_estimado').eq('id', bd.beneficio_id).single();

    // 4) Marcar canjeado + registrar canje (idempotente por unique en canje).
    const { error: updErr } = await admin
      .from('beneficio_desbloqueado')
      .update({ estado: 'canjeado' })
      .eq('id', bd.id).eq('estado', 'disponible'); // condición evita doble canje
    if (updErr) return json({ error: updErr.message }, 400);

    const { error: canjeErr } = await admin.from('canje').insert({
      beneficio_desbloqueado_id: bd.id,
      negocio_id: bd.negocio_id,
      cliente_id: bd.cliente_id,
      beneficio_id: bd.beneficio_id,
      costo: beneficio?.valor_estimado ?? null,
      validado_por: miembro.id,
      metodo: 'qr',
      codigo_temporal: jti,
    });
    if (canjeErr) return json({ error: canjeErr.message }, 400);

    // Datos para mostrar confirmación al personal.
    const { data: cliente } = await admin
      .from('cliente').select('nombre').eq('id', bd.cliente_id).single();

    return json({
      ok: true,
      beneficio: beneficio?.nombre,
      tipo: beneficio?.tipo,
      cliente: cliente?.nombre,
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
