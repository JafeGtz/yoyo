import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { cardShadow, colors, radii, spacing } from '../theme';

/** Tarjeta destacada índigo (puntos/membresía), como en el UI Kit. */
export function HeroCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.hero, style]} />;
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...cardShadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
});
