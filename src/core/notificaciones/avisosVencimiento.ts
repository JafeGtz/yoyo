// Carga perezosa de notifee: si el módulo NATIVO no está compilado (falta el
// rebuild), el import no rompe la pantalla; el error aparece solo al usarlo.
type NotifeeLib = typeof import('@notifee/react-native');
function lib(): NotifeeLib {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@notifee/react-native');
}

/** Un beneficio del cliente para evaluar su vencimiento. */
export interface BeneficioAviso {
  id: string;
  estado: string;
  vence_en: string | null;
  nombre: string;
  negocio: string;
}

/**
 * Programa notificaciones LOCALES (en el dispositivo, sin backend) para avisar
 * que un beneficio disponible está por vencer. Se recalcula cada vez que se
 * llama (cancela las anteriores para no duplicar).
 */
export async function programarAvisosVencimiento(items: BeneficioAviso[]) {
  try {
    const { default: notifee, AndroidImportance, TriggerType, AlarmType } = lib();
    await notifee.requestPermission();
    const canal = await notifee.createChannel({
      id: 'vencimientos', name: 'Beneficios por vencer', importance: AndroidImportance.HIGH,
    });
    await notifee.cancelTriggerNotifications();

    const ahora = Date.now();
    for (const b of items) {
      if (b.estado !== 'disponible' || !b.vence_en) continue;
      const vence = new Date(b.vence_en).getTime();
      if (isNaN(vence) || vence <= ahora) continue;

      let cuando = vence - 24 * 60 * 60 * 1000;      // 24 h antes
      if (cuando <= ahora + 60_000) cuando = vence - 60 * 60 * 1000; // o 1 h antes
      if (cuando <= ahora + 60_000) continue;

      await notifee.createTriggerNotification(
        {
          id: `venc-${b.id}`,
          title: 'Tu premio está por vencer',
          body: `${b.nombre} en ${b.negocio} vence pronto. ¡Aprovéchalo!`,
          android: { channelId: canal, importance: AndroidImportance.HIGH, pressAction: { id: 'default' } },
        },
        // Alarma INEXACTA (no requiere permiso de exact alarm en Android 12+/14).
        { type: TriggerType.TIMESTAMP, timestamp: cuando, alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE } },
      );
    }
  } catch { /* sin permisos o módulo no disponible: no bloquea la app */ }
}

/**
 * MODO PRUEBA: programa una notificación local a ~30 s. Devuelve el detalle para
 * poder diagnosticar (módulo nativo faltante, permiso denegado, etc.).
 */
export async function probarAvisoVencimiento(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { default: notifee, AndroidImportance, TriggerType, AlarmType } = lib();
    const permiso = await notifee.requestPermission();
    const canal = await notifee.createChannel({
      id: 'vencimientos', name: 'Beneficios por vencer', importance: AndroidImportance.HIGH,
    });
    await notifee.createTriggerNotification(
      {
        id: 'venc-prueba',
        title: 'Prueba: tu premio está por vencer',
        body: 'Si ves esto, las notificaciones locales funcionan. Puedes cerrar la app.',
        android: { channelId: canal, importance: AndroidImportance.HIGH, pressAction: { id: 'default' } },
      },
      // Alarma INEXACTA (no requiere permiso de exact alarm en Android 12+/14).
      { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 30_000, alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE } },
    );
    if (permiso.authorizationStatus <= 0) {
      return { ok: false, error: 'Notificaciones DENEGADAS. Actívalas en Ajustes › la app › Notificaciones.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
