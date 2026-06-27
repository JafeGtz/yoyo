// generar-codigo-canje — el cliente pide un código temporal para canjear un
// beneficio. Devuelve un token firmado de corta vida (un solo uso, validado
// por el personal vía canjear-beneficio). No se guarda nada: es stateless.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, getAuthUserId } from '../_shared/clients.ts';
import { signToken } from '../_shared/token.ts';

const TTL_SEGUNDOS = 120; // 2 minutos

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await getAuthUserId(req);
    if (!uid) return json({ error: 'no_autenticado' }, 401);

    const { beneficio_desbloqueado_id } = await req.json();
    if (!beneficio_desbloqueado_id) return json({ error: 'falta_id' }, 400);

    const admin = adminClient();

    const { data: cliente } = await admin
      .from('cliente').select('id').eq('auth_user_id', uid).maybeSingle();
    if (!cliente) return json({ error: 'cliente_no_encontrado' }, 403);

    // El beneficio debe ser del cliente, estar disponible y vigente.
    const { data: bd } = await admin
      .from('beneficio_desbloqueado')
      .select('id, estado, vence_en')
      .eq('id', beneficio_desbloqueado_id)
      .eq('cliente_id', cliente.id)
      .maybeSingle();
    if (!bd) return json({ error: 'beneficio_no_encontrado' }, 404);
    if (bd.estado !== 'disponible') return json({ error: 'beneficio_no_disponible', estado: bd.estado }, 409);
    if (bd.vence_en && new Date(bd.vence_en) < new Date()) return json({ error: 'beneficio_vencido' }, 409);

    const token = await signToken(
      { bd_id: bd.id, cliente_id: cliente.id },
      Deno.env.get('QR_SIGNING_SECRET')!,
      TTL_SEGUNDOS,
    );
    return json({ codigo: token, expira_en_segundos: TTL_SEGUNDOS });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
