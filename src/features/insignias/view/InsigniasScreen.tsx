import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useInsigniasViewModel } from '../viewmodel/useInsigniasViewModel';

const ICONOS: Record<string, string> = {
  sparkle: '✨', medal: '🥇', trophy: '🏆', sunrise: '🌅', moon: '🌙',
  users: '👥', cake: '🎂', compass: '🧭', flame: '🔥', crown: '👑',
};
const emoji = (icono: string | null) => (icono && ICONOS[icono]) || '🏅';

export function InsigniasScreen() {
  const navigation = useNavigation();
  const { perfil } = useSession();
  const { state } = useInsigniasViewModel(perfil?.cliente_id ?? '');

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Insignias</AppText>
      {state.status === 'listo' && (
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          {state.total} de {state.insignias.length} desbloqueadas
        </AppText>
      )}

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}

      {state.status === 'listo' && (
        <View style={styles.grid}>
          {state.insignias.map(i => (
            <SoftCard key={i.id} style={[styles.item, !i.obtenida && styles.bloqueada]}>
              <View style={[styles.circulo, i.obtenida ? styles.circuloOn : styles.circuloOff]}>
                <AppText variant="title">{i.obtenida ? emoji(i.icono) : '🔒'}</AppText>
              </View>
              <AppText variant="caption" style={styles.nombre} color={i.obtenida ? colors.textPrimary : colors.textSecondary}>
                {i.nombre}
              </AppText>
              {i.descripcion && (
                <AppText variant="caption" color={colors.textSecondary} style={styles.desc} numberOfLines={2}>
                  {i.descripcion}
                </AppText>
              )}
            </SoftCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  item: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg },
  bloqueada: { opacity: 0.6 },
  circulo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  circuloOn: { backgroundColor: colors.lavender },
  circuloOff: { backgroundColor: colors.surface },
  nombre: { fontWeight: '700', textAlign: 'center' },
  desc: { textAlign: 'center', marginTop: spacing.xs },
});
