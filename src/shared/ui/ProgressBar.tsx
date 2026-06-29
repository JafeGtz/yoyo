import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  /** Progreso 0..1 */
  valor: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ valor, color = '#fff', trackColor = 'rgba(255,255,255,0.25)' }: Props) {
  const pct = Math.max(0, Math.min(1, valor));
  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { backgroundColor: color, width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
