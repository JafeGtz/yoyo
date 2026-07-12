import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii } from '../theme';

/** Píldora pequeña (por defecto dorada, como el badge de membresía). */
export function Badge({ label, color = colors.mint }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <AppText variant="caption" color="#fff" style={styles.texto}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  texto: { fontWeight: '700', letterSpacing: 0.3 },
});
