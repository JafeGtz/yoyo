import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme';

export function SectionHeader({ titulo, onVerTodo }: { titulo: string; onVerTodo?: () => void }) {
  return (
    <View style={styles.fila}>
      <AppText variant="subtitle">{titulo}</AppText>
      {onVerTodo && (
        <AppText variant="caption" color={colors.primary} onPress={onVerTodo} style={styles.link}>
          Ver todo ›
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  link: { fontWeight: '700' },
});
