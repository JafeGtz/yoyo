import { createClient } from '@/lib/supabase/server';
import { getSesion } from '@/lib/session';
import { TurnosClient, type Empleado, type Turno, type Asistencia } from './TurnosClient';

export default async function TurnosPage() {
  const { negocio } = await getSesion();
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: emps }, { data: turnos }, { data: asis }] = await Promise.all([
    supabase.from('usuario_negocio').select('id, nombre, rol').eq('negocio_id', negocio!.id).eq('activo', true).order('nombre'),
    supabase.from('turno').select('id, usuario_negocio_id, fecha, hora_inicio, hora_fin, notas')
      .eq('negocio_id', negocio!.id).gte('fecha', hoy).order('fecha').order('hora_inicio'),
    supabase.from('asistencia').select('id, usuario_negocio_id, entrada, salida')
      .eq('negocio_id', negocio!.id).order('entrada', { ascending: false }).limit(50),
  ]);

  return (
    <TurnosClient
      negocioId={negocio!.id}
      empleados={(emps as Empleado[]) ?? []}
      inicialTurnos={(turnos as Turno[]) ?? []}
      inicialAsistencia={(asis as Asistencia[]) ?? []}
    />
  );
}
