import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { colors, radii, spacing } from '../../../shared/theme';

/** Descubrir negocios de la red (mapa/directorio). Versión inicial. */
export function DescubrirScreen() {
  return (
    <Screen scroll>
      <AppText variant="title">Descubrir</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
        Encuentra negocios de la red y sus ofertas.
      </AppText>
      <View style={styles.placeholder}>
        <AppText variant="hero">🗺️</AppText>
        <AppText color={colors.textSecondary} style={styles.texto}>
          Pronto verás aquí los negocios cercanos y sus promociones.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  placeholder: {
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  texto: { textAlign: 'center', marginTop: spacing.md },
});
