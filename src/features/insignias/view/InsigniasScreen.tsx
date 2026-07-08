import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { Icon, type IconName } from '../../../shared/ui/Icon';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useInsigniasViewModel } from '../viewmodel/useInsigniasViewModel';

const ICONOS: Record<string, IconName> = {
  sparkle: 'sparkles', medal: 'medal', trophy: 'trophy', sunrise: 'sunrise', moon: 'moon',
  users: 'users', cake: 'cake', compass: 'compass', flame: 'flame', crown: 'crown',
};
const iconOf = (icono: string | null): IconName => (icono && ICONOS[icono]) || 'medal';

export function InsigniasScreen() {
  const navigation = useNavigation();
  const { perfil } = useSession();
  const { state } = useInsigniasViewModel(perfil?.cliente_id ?? '');

  const insignias = state.status === 'listo'
    ? [...state.insignias].sort((a, b) => Number(b.obtenida) - Number(a.obtenida))
    : [];
  const total = state.status === 'listo' ? state.total : 0;
  const de = state.status === 'listo' ? state.insignias.length : 0;

  return (
    <Screen scroll bg={colors.darkBg}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color="#fff">‹</AppText>
      </Pressable>
      <AppText variant="title" color="#fff">Medallero</AppText>

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}

      {state.status === 'listo' && (
        <>
          {/* Resumen tipo trofeo */}
          <HeroCard style={styles.hero}>
            <View style={styles.heroFila}>
              <Icon name="trophy" size={40} color={colors.gold} />
              <View style={styles.heroTxt}>
                <AppText variant="title" color="#fff">{total} de {de}</AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.85)">insignias desbloqueadas</AppText>
              </View>
            </View>
            <View style={styles.heroBar}>
              <ProgressBar valor={de > 0 ? total / de : 0} color={colors.gold} />
            </View>
          </HeroCard>

          {/* Medallero */}
          <View style={styles.grid}>
            {insignias.map(i => (
              <View key={i.id} style={styles.item}>
                <View style={[styles.medalla, i.obtenida ? styles.medallaOn : styles.medallaOff]}>
                  <Icon name={i.obtenida ? iconOf(i.icono) : 'lock'} size={34} color={i.obtenida ? colors.gold : 'rgba(255,255,255,0.35)'} />
                </View>
                <AppText
                  variant="caption"
                  style={styles.nombre}
                  color={i.obtenida ? '#fff' : 'rgba(255,255,255,0.45)'}
                  numberOfLines={2}
                >
                  {i.nombre}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const M = 84;
const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  hero: { marginTop: spacing.md },
  heroFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTxt: { flex: 1 },
  heroBar: { marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.lg },
  item: { width: '31%', alignItems: 'center', marginBottom: spacing.lg },
  medalla: {
    width: M, height: M, borderRadius: M / 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 3,
  },
  medallaOn: {
    backgroundColor: '#FFF6E0', borderColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  medallaOff: { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder },
  medallaEmoji: { fontSize: 38 },
  nombre: { fontWeight: '700', textAlign: 'center' },
});
