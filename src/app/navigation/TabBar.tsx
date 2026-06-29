import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText } from '../../shared/ui/AppText';
import { cardShadow, colors, radii, spacing } from '../../shared/theme';

const ICONOS: Record<string, string> = {
  Inicio: '🏠',
  Beneficios: '🎁',
  Escanear: '⛶',
  Descubrir: '🏪',
  Perfil: '👤',
};

/** Tab bar flotante con botón de escaneo central elevado (estilo UI Kit). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.contenedor, { paddingBottom: insets.bottom || spacing.sm }]}>
      <View style={styles.barra}>
        {state.routes.map((route, index) => {
          const activo = state.index === index;
          const esCentral = route.name === 'Escanear';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!activo && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (esCentral) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.fabWrap}>
                <View style={styles.fab}>
                  <AppText variant="title" color="#fff">{ICONOS.Escanear}</AppText>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <AppText variant="subtitle" color={activo ? colors.primary : colors.textSecondary}>
                {ICONOS[route.name] ?? '•'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 64,
    paddingHorizontal: spacing.sm,
    ...cardShadow,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...cardShadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
  },
});
