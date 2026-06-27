import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, spacing } from '../theme';

/** Tarjeta base reutilizable. */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
