import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

interface Props extends TextInputProps {
  label?: string;
}

export function AppInput({ label, style, ...rest }: Props) {
  return (
    <View style={styles.contenedor}>
      {label && (
        <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      )}
      <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, style]} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs, marginLeft: spacing.xs },
  input: {
    height: 56,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
