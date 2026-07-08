import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { cardShadow, colors, radii, spacing } from '../theme';

/**
 * Tarjeta destacada con degradado morado→violeta (puntos/membresía), como el UI Kit.
 * Dos capas: la externa lleva la sombra (sin overflow), la interna recorta el
 * degradado. Color sólido de respaldo por si el SVG no pinta.
 */
export function HeroCard({ style, children, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[styles.shadow, style]}>
      <View style={styles.clip}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#5B46F0" />
              <Stop offset="1" stopColor="#9B5DE5" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" />
        </Svg>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.xl,
    backgroundColor: colors.primary, // respaldo sólido + base para la sombra
    ...cardShadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  clip: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: spacing.lg,
  },
});
