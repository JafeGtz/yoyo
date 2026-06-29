import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { cardShadow, colors, radii, spacing } from '../theme';

/** Tarjeta blanca con sombra suave (estilo UI Kit). */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

/** Tarjeta clara (lavanda-gris) sin sombra, para filas/listas. */
export function SoftCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.soft, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...cardShadow,
  },
  soft: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
