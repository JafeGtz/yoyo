import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme';

/**
 * Medidor de visitas tipo regla: marca los hitos (umbrales de beneficios) con
 * su número y un marcador que indica en qué visita vas. No es una barra que se
 * llena "a lo tonto": muestra tu posición en la escala.
 */
export function MedidorVisitas({
  visitas,
  hitos,
  sobreOscuro = false,
}: {
  visitas: number;
  hitos: number[];
  sobreOscuro?: boolean;
}) {
  const marcas = Array.from(new Set(hitos.filter(h => h > 0))).sort((a, b) => a - b);
  const max = Math.max(visitas, marcas.length ? marcas[marcas.length - 1] : 1, 1);
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));

  const track = sobreOscuro ? 'rgba(255,255,255,0.22)' : colors.surface;
  const fill = sobreOscuro ? colors.mint : colors.primary;
  const tickOff = sobreOscuro ? 'rgba(255,255,255,0.45)' : colors.border;
  const numOff = sobreOscuro ? 'rgba(255,255,255,0.75)' : colors.textSecondary;
  const numOn = sobreOscuro ? '#fff' : colors.primary;

  return (
    <View>
      <View style={[styles.track, { backgroundColor: track }]}>
        <View style={[styles.fill, { width: `${pct(visitas)}%`, backgroundColor: fill }]} />
        {marcas.map(m => (
          <View key={m} style={[styles.tick, { left: `${pct(m)}%`, backgroundColor: m <= visitas ? '#fff' : tickOff }]} />
        ))}
        <View style={[styles.knob, { left: `${pct(visitas)}%`, borderColor: fill }]} />
      </View>
      <View style={styles.escala}>
        {marcas.map(m => (
          <AppText
            key={m}
            variant="caption"
            color={m <= visitas ? numOn : numOff}
            style={[styles.numero, { left: `${pct(m)}%` }]}
          >
            {m}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 12, borderRadius: 6, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 12, borderRadius: 6 },
  tick: { position: 'absolute', width: 2, height: 12, marginLeft: -1 },
  knob: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    borderWidth: 4, marginLeft: -9, top: -3,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  escala: { height: 18, marginTop: 6 },
  numero: { position: 'absolute', width: 34, marginLeft: -17, textAlign: 'center', fontWeight: '700' },
});
