// registrar-visita — el cliente escanea el QR del negocio.
// Valida firma + QR activo, antifraude (1 visita/24h), geocerca opcional,
// registra la visita, actualiza el acumulado y desbloquea beneficios.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';
import { verifyToken } from '../_shared/token.ts';

// Distancia en metros entre dos coordenadas (Haversine).
function distanciaM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { qr_token, lat, lng, monto, codigo } = await req.json();
    if (!qr_token) return json({ error: 'falta_qr_token' }, 400);

    const admin = adminClient();

    // Cliente que registra (se toma del JWT, nunca del body).
    const { data: cliente } = await admin
      .from('cliente').select('id').eq('auth_user_id', uid).maybeSingle();
    if (!cliente) return json({ error: 'cliente_no_encontrado' }, 403);

    // 1) Verificar firma del QR y extraer negocio.
    let negocioId: string;
    try {
      const payload = await verifyToken(qr_token, Deno.env.get('QR_SIGNING_SECRET')!);
      negocioId = payload.negocio_id;
    } catch (e) {
      return json({ error: 'qr_invalido', detalle: String(e?.message ?? e) }, 400);
    }

    // 2) El token debe ser el QR activo y vigente del negocio.
    const { data: qr } = await admin
      .from('negocio_qr')
      .select('id')
      .eq('negocio_id', negocioId)
      .eq('token', qr_token)
      .eq('activo', true)
      .gt('expira_en', new Date().toISOString())
      .maybeSingle();
    if (!qr) return json({ error: 'qr_caducado_o_inactivo' }, 400);

    const { data: negocio } = await admin
      .from('negocio')
      .select('id, lat, lng, radio_geocerca_m, modelo_acumulacion, estado, seguridad_visita')
      .eq('id', negocioId).single();
    if (!negocio || negocio.estado === 'cancelado' || negocio.estado === 'suspendido') {
      return json({ error: 'negocio_no_disponible' }, 400);
    }

    // 2.5) Si el negocio exige código, validarlo y consumirlo (un uso).
    if (negocio.seguridad_visita === 'codigo') {
      const cod = String(codigo ?? '').trim();
      if (!cod) return json({ error: 'falta_codigo_visita' }, 400);

      const { data: cv } = await admin
        .from('codigo_visita')
        .select('id, usos, usos_max')
        .eq('negocio_id', negocioId)
        .eq('codigo', cod)
        .gt('expira_en', new Date().toISOString())
        .order('creado_en', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cv || cv.usos >= cv.usos_max) return json({ error: 'codigo_invalido' }, 400);

      // Consumo con bloqueo optimista (evita doble uso por escaneos simultáneos).
      const { data: consumido } = await admin
        .from('codigo_visita')
        .update({ usos: cv.usos + 1 })
        .eq('id', cv.id)
        .eq('usos', cv.usos)
        .select('id')
        .maybeSingle();
      if (!consumido) return json({ error: 'codigo_invalido' }, 409);
    }

    // 3) Antifraude: máximo 1 visita por cliente/negocio cada 24 h.
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('visita')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', cliente.id)
      .eq('negocio_id', negocioId)
      .gt('creado_en', hace24h);
    if ((count ?? 0) > 0) return json({ error: 'visita_duplicada_24h' }, 429);

    // 4) Geocerca opcional.
    if (negocio.radio_geocerca_m && negocio.lat != null && negocio.lng != null) {
      if (lat == null || lng == null) return json({ error: 'falta_ubicacion' }, 400);
      const d = distanciaM(lat, lng, negocio.lat, negocio.lng);
      if (d > negocio.radio_geocerca_m) return json({ error: 'fuera_del_area', distancia_m: Math.round(d) }, 403);
    }

    // 5) Registrar la visita. (No tragar el error: dispara triggers de
    //    gamificación; si falla, hay que reportarlo, no fingir éxito.)
    const montoVisita = negocio.modelo_acumulacion === 'plus' ? (monto ?? null) : null;
    const { data: visitaRow, error: visitaErr } = await admin.from('visita').insert({
      cliente_id: cliente.id, negocio_id: negocioId, via: 'qr',
      lat: lat ?? null, lng: lng ?? null, monto: montoVisita,
    }).select('id').single();
    if (visitaErr) return json({ error: 'error_registrar_visita', detalle: visitaErr.message }, 500);

    // 6) Actualizar acumulado (cliente_negocio).
    const ahora = new Date().toISOString();
    const { data: rel } = await admin
      .from('cliente_negocio')
      .select('id, visitas_totales, monto_acumulado, primera_visita')
      .eq('cliente_id', cliente.id).eq('negocio_id', negocioId).maybeSingle();

    let visitasTotales: number;
    let montoAcum: number;
    if (rel) {
      visitasTotales = rel.visitas_totales + 1;
      montoAcum = Number(rel.monto_acumulado) + Number(montoVisita ?? 0);
      await admin.from('cliente_negocio').update({
        visitas_totales: visitasTotales,
        monto_acumulado: montoAcum,
        ultima_visita: ahora,
        primera_visita: rel.primera_visita ?? ahora,
      }).eq('id', rel.id);
    } else {
      visitasTotales = 1;
      montoAcum = Number(montoVisita ?? 0);
      await admin.from('cliente_negocio').insert({
        cliente_id: cliente.id, negocio_id: negocioId,
        visitas_totales: 1, monto_acumulado: montoAcum,
        primera_visita: ahora, ultima_visita: ahora,
      });
    }

    // 7) Desbloquear beneficios cuya condición se cumple y aún no se tienen.
    const { data: beneficios } = await admin
      .from('beneficio')
      .select('id, nombre, condicion_tipo, condicion_visitas, condicion_monto, vigencia_dias, stock_total')
      .eq('negocio_id', negocioId).eq('estado', 'activo');

    const desbloqueados: { id: string; nombre: string }[] = [];
    for (const b of beneficios ?? []) {
      const cumpleVisitas = b.condicion_visitas == null || visitasTotales >= b.condicion_visitas;
      const cumpleMonto = b.condicion_monto == null || montoAcum >= Number(b.condicion_monto);
      const cumple =
        b.condicion_tipo === 'visitas' ? cumpleVisitas :
        b.condicion_tipo === 'monto' ? cumpleMonto :
        cumpleVisitas && cumpleMonto; // combinado
      if (!cumple) continue;

      const { count: ya } = await admin
        .from('beneficio_desbloqueado')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id).eq('beneficio_id', b.id);
      if ((ya ?? 0) > 0) continue;

      // Hueco 1: si el beneficio tiene stock, solo se desbloquea (reserva) si aún
      // quedan unidades. Disponibles = stock - reservados(no vencidos) - canjeados.
      // Los vencidos no cuentan como reservados => se liberan solos (Hueco 6).
      if (b.stock_total != null) {
        const nowIso = new Date().toISOString();
        const { count: reservados } = await admin
          .from('beneficio_desbloqueado')
          .select('id', { count: 'exact', head: true })
          .eq('beneficio_id', b.id).eq('estado', 'disponible').gt('vence_en', nowIso);
        const { count: canjeados } = await admin
          .from('beneficio_desbloqueado')
          .select('id', { count: 'exact', head: true })
          .eq('beneficio_id', b.id).eq('estado', 'canjeado');
        const disponibles = b.stock_total - (reservados ?? 0) - (canjeados ?? 0);
        if (disponibles <= 0) continue; // agotado: no se desbloquea
      }

      const vence = new Date(Date.now() + (b.vigencia_dias ?? 30) * 86400000).toISOString();
      const { data: nuevo } = await admin.from('beneficio_desbloqueado').insert({
        cliente_id: cliente.id, beneficio_id: b.id, negocio_id: negocioId,
        estado: 'disponible', vence_en: vence,
      }).select('id').single();
      if (nuevo) desbloqueados.push({ id: nuevo.id, nombre: b.nombre });
    }

    return json({
      visita_id: visitaRow?.id,
      negocio_id: negocioId,
      visita_numero: visitasTotales,
      monto_acumulado: montoAcum,
      beneficios_desbloqueados: desbloqueados,
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
