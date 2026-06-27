// girar-juego — gira la ruleta o rasca y gana: elige un premio al azar
// ponderado por su probabilidad. Lo usará la app del cliente; aquí también
// sirve para que el dueño pruebe su configuración desde el SaaS.
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
    const { data: premios } = await admin
      .from('premio_juego')
      .select('nombre, probabilidad')
      .eq('negocio_id', negocio_id)
      .eq('juego', juego)
      .eq('activo', true);

    if (!premios || premios.length === 0) return json({ error: 'sin_premios' }, 400);

    // Selección ponderada por probabilidad. Si no suman 100, se normaliza.
    const total = premios.reduce((s, p) => s + Number(p.probabilidad), 0);
    let r = Math.random() * total;
    let ganado = premios[premios.length - 1].nombre;
    for (const p of premios) {
      r -= Number(p.probabilidad);
      if (r <= 0) { ganado = p.nombre; break; }
    }

    return json({ premio: ganado });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
