import { supabase } from '../supabase/supabaseClient';

export interface ResultadoVisita {
  visita_numero: number;
  monto_acumulado: number;
  beneficios_desbloqueados: { id: string; nombre: string }[];
}

export interface ResultadoCanje {
  ok: boolean;
  beneficio: string;
  tipo: string;
  cliente: string;
}

// Traduce los códigos de error de las Edge Functions a mensajes para el usuario.
const MENSAJES: Record<string, string> = {
  qr_invalido: 'El código QR no es válido.',
  qr_caducado_o_inactivo: 'Este QR expiró. Pide al negocio que lo regenere.',
  visita_duplicada_24h: 'Ya registraste una visita aquí hoy. Vuelve mañana 🙂',
  fuera_del_area: 'Estás fuera del área del negocio.',
  falta_ubicacion: 'Activa la ubicación para registrar la visita.',
  negocio_no_disponible: 'Este negocio no está disponible.',
  cliente_no_encontrado: 'Tu cuenta de cliente no está completa.',
  beneficio_no_encontrado: 'No encontramos ese beneficio.',
  beneficio_no_disponible: 'Este beneficio ya no está disponible.',
  beneficio_vencido: 'Este beneficio ya venció.',
  codigo_invalido: 'El código no es válido o ya expiró.',
  no_autorizado: 'No tienes permiso para esta acción.',
  no_autenticado: 'Inicia sesión para continuar.',
};

const traducir = (codigo: string) => MENSAJES[codigo] ?? 'Ocurrió un error. Intenta de nuevo.';

async function invocar<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  // Errores HTTP (4xx/5xx): el cuerpo trae { error: 'codigo' }.
  if (error) {
    const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (ctx?.json) {
      try {
        const cuerpo = await ctx.json();
        if (cuerpo?.error) throw new Error(traducir(cuerpo.error));
      } catch (e) {
        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
    throw new Error('No pudimos conectar. Revisa tu internet.');
  }
  if (data?.error) throw new Error(traducir(data.error));
  return data as T;
}

export function registrarVisita(qrToken: string, ubicacion?: { lat: number; lng: number }) {
  return invocar<ResultadoVisita>('registrar-visita', {
    qr_token: qrToken,
    lat: ubicacion?.lat,
    lng: ubicacion?.lng,
  });
}

export function generarCodigoCanje(beneficioDesbloqueadoId: string) {
  return invocar<{ codigo: string; expira_en_segundos: number }>('generar-codigo-canje', {
    beneficio_desbloqueado_id: beneficioDesbloqueadoId,
  });
}

export function canjearBeneficio(codigo: string) {
  return invocar<ResultadoCanje>('canjear-beneficio', { codigo });
}
