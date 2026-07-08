import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { colors, radii, spacing } from '../theme';

/** Badge de nivel de membresía, prominente. Sobre claro usa color de acento;
 *  sobre oscuro (hero) usa vidrio blanco. */
export function NivelBadge({ nivel, fuerte, suave, sobreOscuro, grande }: {
  nivel: string;
  fuerte?: string;
  suave?: string;
  sobreOscuro?: boolean;
  grande?: boolean;
}) {
  const bg = sobreOscuro ? 'rgba(255,255,255,0.18)' : (suave ?? colors.lavender);
  const fg = sobreOscuro ? '#fff' : (fuerte ?? colors.primary);
  return (
    <View style={[styles.badge, grande && styles.badgeGrande, { backgroundColor: bg }]}>
      <Icon name="crown" size={grande ? 16 : 13} color={fg} />
      <AppText variant={grande ? 'subtitle' : 'caption'} color={fg} style={styles.txt}>
        Nivel {nivel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  badgeGrande: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  txt: { fontWeight: '800' },
});
