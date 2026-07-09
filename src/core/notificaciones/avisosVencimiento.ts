import notifee, { AndroidImportance, TriggerType, type TimestampTrigger } from '@notifee/react-native';

/** Un beneficio del cliente para evaluar su vencimiento. */
export interface BeneficioAviso {
  id: string;
  estado: string;
  vence_en: string | null;
  nombre: string;
  negocio: string;
}

let permisoPedido = false;

async function pedirPermiso() {
  if (permisoPedido) return;
  permisoPedido = true;
  try { await notifee.requestPermission(); } catch { /* usuario puede negar */ }
}

/**
 * Programa notificaciones LOCALES (en el dispositivo, sin backend) para avisar
 * que un beneficio disponible está por vencer. Se recalcula cada vez que se
 * llama (cancela las anteriores para no duplicar).
 */
export async function programarAvisosVencimiento(items: BeneficioAviso[]) {
  try {
    await pedirPermiso();
    const canal = await notifee.createChannel({
      id: 'vencimientos',
      name: 'Beneficios por vencer',
      importance: AndroidImportance.HIGH,
    });

    // Limpia los avisos programados previos (evita acumular/duplicar).
    await notifee.cancelTriggerNotifications();

    const ahora = Date.now();
    for (const b of items) {
      if (b.estado !== 'disponible' || !b.vence_en) continue;
      const vence = new Date(b.vence_en).getTime();
      if (isNaN(vence) || vence <= ahora) continue;

      // Avisar 24h antes; si esa marca ya pasó pero aún no vence, avisar 1h antes.
      let cuando = vence - 24 * 60 * 60 * 1000;
      if (cuando <= ahora + 60_000) cuando = vence - 60 * 60 * 1000;
      if (cuando <= ahora + 60_000) continue; // demasiado cerca, no tiene caso

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: cuando,
        alarmManager: { allowWhileIdle: true },
      };

      await notifee.createTriggerNotification(
        {
          id: `venc-${b.id}`, // id estable: reprogramar reemplaza, no duplica
          title: 'Tu premio está por vencer',
          body: `${b.nombre} en ${b.negocio} vence pronto. ¡Aprovéchalo!`,
          android: {
            channelId: canal,
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
          },
        },
        trigger,
      );
    }
  } catch { /* sin permisos o módulo no disponible: no bloquea la app */ }
}

/**
 * MODO PRUEBA: programa una notificación local de ejemplo a ~30 segundos para
 * verificar que las notificaciones locales funcionan en el dispositivo.
 * Devuelve true si quedó programada.
 */
export async function probarAvisoVencimiento(): Promise<{ ok: boolean; error?: string }> {
  try {
    const permiso = await notifee.requestPermission();
    const canal = await notifee.createChannel({
      id: 'vencimientos',
      name: 'Beneficios por vencer',
      importance: AndroidImportance.HIGH,
    });
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + 30_000,
      alarmManager: { allowWhileIdle: true },
    };
    await notifee.createTriggerNotification(
      {
        id: 'venc-prueba',
        title: 'Prueba: tu premio está por vencer',
        body: 'Si ves esto, las notificaciones locales funcionan. Puedes cerrar la app.',
        android: { channelId: canal, importance: AndroidImportance.HIGH, pressAction: { id: 'default' } },
      },
      trigger,
    );
    // authorizationStatus: 1 = permitido, 0/-1 = denegado.
    if (permiso.authorizationStatus <= 0) {
      return { ok: false, error: 'Notificaciones DENEGADAS. Actívalas en Ajustes › la app › Notificaciones.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
