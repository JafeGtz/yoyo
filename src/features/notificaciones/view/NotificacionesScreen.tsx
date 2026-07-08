import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
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
  const { state, marcarLeida, marcarTodas, eliminar } = useNotificacionesViewModel(perfil?.cliente_id ?? '');

  const lista = state.status === 'listo' ? state.notificaciones : [];
  const noLeidas = lista.filter(n => !n.leida_en).length;

  const grupos: { titulo: string; items: Notificacion[] }[] = [];
  for (const n of lista) {
    const g = grupo(n.creada_en);
    let bucket = grupos.find(x => x.titulo === g);
    if (!bucket) { bucket = { titulo: g, items: [] }; grupos.push(bucket); }
    bucket.items.push(n);
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <View style={styles.encabezado}>
        <AppText variant="title" style={styles.flex}>Notificaciones</AppText>
        {noLeidas > 0 && (
          <Pressable onPress={marcarTodas} style={styles.marcarTodas} hitSlop={8}>
            <Icon name="check2" size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.primary} style={styles.bold}>Marcar leídas</AppText>
          </Pressable>
        )}
      </View>

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}
      {state.status === 'listo' && lista.length === 0 && (
        <AppText color={colors.textSecondary} style={styles.vacio}>No tienes notificaciones todavía.</AppText>
      )}

      {grupos.map(g => (
        <View key={g.titulo}>
          <AppText variant="subtitle" color={colors.textSecondary} style={styles.grupo}>{g.titulo}</AppText>
          {g.items.map(n => {
            const noLeida = !n.leida_en;
            return (
              <Pressable
                key={n.id}
                onPress={() => noLeida && marcarLeida(n.id)}
                style={[styles.item, noLeida ? styles.itemNoLeido : styles.itemLeido]}
              >
                <View style={[styles.icono, noLeida ? styles.iconoNoLeido : styles.iconoLeido]}>
                  <Icon name={iconOf(n.tipo)} size={22} color={noLeida ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.flex}>
                  <View style={styles.tituloFila}>
                    {noLeida && <View style={styles.punto} />}
                    <AppText variant="subtitle" color={noLeida ? colors.textPrimary : colors.textSecondary} style={styles.flex}>{n.titulo}</AppText>
                  </View>
                  {n.cuerpo && <AppText variant="caption" color={colors.textSecondary}>{n.cuerpo}</AppText>}
                  <AppText variant="caption" color={colors.textSecondary} style={styles.hora}>
                    {new Date(n.creada_en).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </View>
                <Pressable onPress={() => eliminar(n.id)} hitSlop={10} style={styles.borrar}>
                  <Icon name="trash" size={18} color={colors.textSecondary} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  marcarTodas: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.lg },
  grupo: { marginTop: spacing.lg, marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderRadius: radii.lg, padding: spacing.md },
  itemNoLeido: { backgroundColor: colors.lavender },
  itemLeido: { backgroundColor: colors.surface, opacity: 0.85 },
  icono: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconoNoLeido: { backgroundColor: '#fff' },
  iconoLeido: { backgroundColor: colors.white },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  hora: { marginTop: spacing.xs },
  borrar: { padding: spacing.sm, marginLeft: spacing.sm },
});
