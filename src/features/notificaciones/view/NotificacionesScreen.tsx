import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { Icon, type IconName } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useNotificacionesViewModel, type Notificacion } from '../viewmodel/useNotificacionesViewModel';

const ICONO: Record<string, IconName> = {
  campana: 'megaphone', vencimiento: 'bell', inactividad: 'user', cumpleanos: 'cake', referido: 'users', premio: 'gift',
};
const iconOf = (tipo: string): IconName => ICONO[tipo] ?? 'bell';

// Agrupa por Hoy / Ayer / Anteriores.
function grupo(fecha: string): string {
  const d = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 86400000);
  const mismaFecha = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mismaFecha(d, hoy)) return 'Hoy';
  if (mismaFecha(d, ayer)) return 'Ayer';
  return 'Anteriores';
}

export function NotificacionesScreen() {
  const navigation = useNavigation();
  const { perfil } = useSession();
  const { state } = useNotificacionesViewModel(perfil?.cliente_id ?? '');

  const grupos: { titulo: string; items: Notificacion[] }[] = [];
  if (state.status === 'listo') {
    for (const n of state.notificaciones) {
      const g = grupo(n.creada_en);
      let bucket = grupos.find(x => x.titulo === g);
      if (!bucket) {
        bucket = { titulo: g, items: [] };
        grupos.push(bucket);
      }
      bucket.items.push(n);
    }
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Notificaciones</AppText>

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}
      {state.status === 'listo' && state.notificaciones.length === 0 && (
        <AppText color={colors.textSecondary} style={styles.vacio}>No tienes notificaciones todavía.</AppText>
      )}

      {grupos.map(g => (
        <View key={g.titulo}>
          <AppText variant="subtitle" style={styles.grupo}>{g.titulo}</AppText>
          {g.items.map(n => (
            <SoftCard key={n.id} style={styles.item}>
              <View style={styles.icono}><Icon name={iconOf(n.tipo)} size={22} color={colors.primary} /></View>
              <View style={styles.flex}>
                <AppText variant="subtitle">{n.titulo}</AppText>
                {n.cuerpo && <AppText variant="caption" color={colors.textSecondary}>{n.cuerpo}</AppText>}
                <AppText variant="caption" color={colors.textSecondary} style={styles.hora}>
                  {new Date(n.creada_en).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
              {!n.leida_en && <View style={styles.punto} />}
            </SoftCard>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.lg },
  grupo: { marginTop: spacing.lg, marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  icono: {
    width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.lavender,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  flex: { flex: 1 },
  hora: { marginTop: spacing.xs },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.sm },
});
