import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { QrScanner } from '../../../shared/ui/QrScanner';
import { colors, radii, spacing } from '../../../shared/theme';
import { registrarVisita, type ResultadoVisita } from '../../../data/services/canjeService';

const FONDO = '#15131F';
type Estado = 'escaneando' | 'procesando' | 'exito' | 'error';

export function EscanearScreen() {
  const enfocada = useIsFocused();
  const [estado, setEstado] = useState<Estado>('escaneando');
  const [resultado, setResultado] = useState<ResultadoVisita | null>(null);
  const [error, setError] = useState<string>('');

  async function onScan(qrToken: string) {
    setEstado('procesando');
    try {
      const r = await registrarVisita(qrToken);
      setResultado(r);
      setEstado('exito');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar la visita.');
      setEstado('error');
    }
  }

  function reiniciar() {
    setResultado(null);
    setError('');
    setEstado('escaneando');
  }

  // Éxito: pantalla clara y celebratoria.
  if (estado === 'exito' && resultado) {
    return (
      <Screen>
        <View style={styles.centroClaro}>
          <AppText variant="hero">🎉</AppText>
          <AppText variant="title" style={styles.exitoTitulo}>¡Visita registrada!</AppText>
          <AppText variant="subtitle" color={colors.primary}>Visita #{resultado.visita_numero}</AppText>

          {resultado.beneficios_desbloqueados.length > 0 && (
            <View style={styles.beneficios}>
              <AppText variant="caption" color={colors.textSecondary}>Desbloqueaste:</AppText>
              {resultado.beneficios_desbloqueados.map(b => (
                <AppText key={b.id} variant="subtitle" color={colors.mint} style={styles.beneficio}>
                  🎁 {b.nombre}
                </AppText>
              ))}
            </View>
          )}

          <AppButton titulo="Listo" onPress={reiniciar} style={styles.botonClaro} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fondo}>
      {estado === 'escaneando' && (
        <QrScanner activo={enfocada} onScan={onScan} instruccion="Apunta al QR del negocio" />
      )}

      {estado === 'procesando' && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <AppText color="#fff" style={styles.overlayTexto}>Registrando tu visita…</AppText>
        </View>
      )}

      {estado === 'error' && (
        <View style={styles.overlay}>
          <AppText variant="hero">😕</AppText>
          <AppText color="#fff" style={styles.overlayTexto}>{error}</AppText>
          <AppButton titulo="Reintentar" onPress={reiniciar} style={styles.botonOscuro} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: FONDO },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: FONDO },
  overlayTexto: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  botonOscuro: { alignSelf: 'stretch', backgroundColor: colors.primary },
  centroClaro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exitoTitulo: { marginTop: spacing.md },
  beneficios: { alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignSelf: 'stretch' },
  beneficio: { marginTop: spacing.xs },
  botonClaro: { alignSelf: 'stretch', marginTop: spacing.xl },
});
