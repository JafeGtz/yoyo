// girar-juego — ruleta o rasca y gana. Valida nivel y límite de giros,
// elige un premio ponderado por probabilidad, y si el premio mapea a un
// beneficio lo DESBLOQUEA (queda en "Tus beneficios") + notifica. Registra
// cada jugada en juego_giro.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { negocio_id, juego } = await req.json();
    if (!negocio_id || !juego) return json({ error: 'faltan_datos' }, 400);

    const admin = adminClient();

    // Cliente que juega.
    const { data: cli } = await admin.from('cliente').select('id').eq('auth_user_id', uid).maybeSingle();
    if (!cli) return json({ error: 'no_cliente' }, 403);
    const clienteId = cli.id;

    // Config del juego (nivel requerido + giros por día).
    const { data: cfg } = await admin
      .from('juego_config')
      .select('nivel_membresia_id, giros_max_dia')
      .eq('negocio_id', negocio_id).eq('juego', juego).maybeSingle();
    const girosMax = cfg?.giros_max_dia ?? 1;

    // Relación con el negocio (nivel actual del cliente).
    const { data: rel } = await admin
      .from('cliente_negocio')
      .select('nivel_membresia_id')
      .eq('negocio_id', negocio_id).eq('cliente_id', clienteId).maybeSingle();

    // Validación de nivel: el cliente debe tener el nivel requerido o superior.
    if (cfg?.nivel_membresia_id) {
      const { data: reqNivel } = await admin
        .from('nivel_membresia').select('visitas_minimas').eq('id', cfg.nivel_membresia_id).maybeSingle();
      let clienteMin = -1;
      if (rel?.nivel_membresia_id) {
        const { data: cliNivel } = await admin
          .from('nivel_membresia').select('visitas_minimas').eq('id', rel.nivel_membresia_id).maybeSingle();
        clienteMin = cliNivel?.visitas_minimas ?? -1;
      }
      if (!reqNivel || clienteMin < reqNivel.visitas_minimas) {
        return json({ error: 'nivel_insuficiente' }, 403);
      }
    }

    // Límite de giros (ventana de 24 h).
    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count: giros } = await admin
      .from('juego_giro').select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocio_id).eq('cliente_id', clienteId).eq('juego', juego).gte('creado_en', desde);
    if ((giros ?? 0) >= girosMax) return json({ error: 'sin_giros' }, 429);

    // Premios activos.
    const { data: premios } = await admin
      .from('premio_juego')
      .select('id, nombre, probabilidad, beneficio_id')
      .eq('negocio_id', negocio_id).eq('juego', juego).eq('activo', true);
    if (!premios || premios.length === 0) return json({ error: 'sin_premios' }, 400);

    // Selección ponderada por probabilidad.
    const total = premios.reduce((s, p) => s + Number(p.probabilidad), 0) || premios.length;
    let r = Math.random() * total;
    let sel = premios[premios.length - 1];
    for (const p of premios) { r -= Number(p.probabilidad) || 0; if (r <= 0) { sel = p; break; } }

    // Si el premio mapea a un beneficio, se desbloquea (respeta stock).
    let bdId: string | null = null;
    let agotado = false;
    if (sel.beneficio_id) {
      const { data: otorgado } = await admin.rpc('otorgar_beneficio', {
        p_cliente_id: clienteId,
        p_beneficio_id: sel.beneficio_id,
        p_titulo: juego === 'rasca' ? 'Ganaste rascando' : 'Ganaste en la ruleta',
      });
      bdId = (otorgado as string) ?? null;
      agotado = bdId == null; // había beneficio configurado pero sin stock
    }

    // Registrar la jugada (persiste el premio y cuenta para el límite).
    await admin.from('juego_giro').insert({
      negocio_id, cliente_id: clienteId, juego,
      premio_juego_id: sel.id, premio_nombre: sel.nombre,
      beneficio_desbloqueado_id: bdId,
    });

    return json({ premio: sel.nombre, canjeable: bdId != null, agotado });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
