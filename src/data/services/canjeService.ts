import { supabase } from '../supabase/supabaseClient';

export interface ResultadoVisita {
  visita_id: string;
  negocio_id: string;
  visita_numero: number;
  monto_acumulado: number;
  beneficios_desbloqueados: { id: string; nombre: string }[];
}

export interface ProductoOpcion { id: string; nombre: string }

export interface ResultadoCanje {
  ok: boolean;
  beneficio: string;
  tipo: string;
  cliente: string;
}

const MENSAJES: Record<string, string> = {
  qr_invalido: 'El código QR no es válido.',
  qr_caducado_o_inactivo: 'Este QR expiró. Pide al negocio que lo regenere.',
  visita_duplicada_24h: 'Ya registraste una visita aquí hoy. Vuelve mañana 🙂',
  fuera_del_area: 'Estás fuera del área del negocio.',
  falta_ubicacion: 'Activa la ubicación para registrar la visita.',
  falta_codigo_visita: 'Este negocio pide un código. Pídeselo al personal.',
  codigo_invalido: 'El código no es válido o ya se usó.',
  negocio_no_disponible: 'Este negocio no está disponible.',
  cliente_no_encontrado: 'Tu cuenta de cliente no está completa.',
  beneficio_no_encontrado: 'No encontramos ese beneficio.',
  beneficio_no_disponible: 'Este beneficio ya no está disponible.',
  beneficio_vencido: 'Este beneficio ya venció.',
  no_autorizado: 'No tienes permiso para esta acción.',
  no_autenticado: 'Inicia sesión para continuar.',
};

const traducir = (codigo: string) => MENSAJES[codigo] ?? 'Ocurrió un error. Intenta de nuevo.';

/** Error que conserva el código de la API (para detectar casos específicos). */
export class ApiError extends Error {
  codigo: string;
  constructor(codigo: string) {
    super(traducir(codigo));
    this.codigo = codigo;
  }
}

async function invocar<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (error) {
    const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (ctx?.json) {
      try {
        const cuerpo = await ctx.json();
        if (cuerpo?.error) throw new ApiError(cuerpo.error);
      } catch (e) {
        if (e instanceof ApiError) throw e;
      }
    }
    throw new Error('No pudimos conectar. Revisa tu internet.');
  }
  if (data?.error) throw new ApiError(data.error);
  return data as T;
}

export function registrarVisita(
  qrToken: string,
  ubicacion?: { lat: number; lng: number },
  codigo?: string,
) {
  return invocar<ResultadoVisita>('registrar-visita', {
    qr_token: qrToken,
    lat: ubicacion?.lat,
    lng: ubicacion?.lng,
    codigo,
  });
}

/** Catálogo del negocio (para etiquetar el producto de una visita). */
export async function catalogoDelNegocio(negocioId: string): Promise<ProductoOpcion[]> {
  const { data } = await supabase
    .from('catalogo_item')
    .select('id, nombre')
    .eq('negocio_id', negocioId)
    .order('orden');
  return (data as ProductoOpcion[]) ?? [];
}

/** El cliente etiqueta qué producto se llevó en su visita (avanza retos de producto). */
export async function marcarProductoVisita(visitaId: string, itemId: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_producto_visita', {
    p_visita_id: visitaId,
    p_item_id: itemId,
  });
  if (error) throw new Error(error.message);
}

export function generarCodigoVisita(negocioId: string, usosMax?: number) {
  return invocar<{ codigo: string; usos_max: number; expira_en_segundos: number }>(
    'generar-codigo-visita',
    { negocio_id: negocioId, usos_max: usosMax },
  );
}

export function generarCodigoCanje(beneficioDesbloqueadoId: string) {
  return invocar<{ codigo: string; expira_en_segundos: number }>('generar-codigo-canje', {
    beneficio_desbloqueado_id: beneficioDesbloqueadoId,
  });
}

export function canjearBeneficio(codigo: string) {
  return invocar<ResultadoCanje>('canjear-beneficio', { codigo });
}
