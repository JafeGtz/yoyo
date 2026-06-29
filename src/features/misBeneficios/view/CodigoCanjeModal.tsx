import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { generarCodigoCanje } from '../../../data/services/canjeService';

interface Props {
  beneficioId: string | null;
  nombre: string;
  onClose: () => void;
}

type Estado = 'cargando' | 'listo' | 'error';

export function CodigoCanjeModal({ beneficioId, nombre, onClose }: Props) {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [codigo, setCodigo] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState('');

  const generar = useCallback(async () => {
    if (!beneficioId) return;
    setEstado('cargando');
    setError('');
    try {
      const r = await generarCodigoCanje(beneficioId);
      setCodigo(r.codigo);
      setSegundos(r.expira_en_segundos);
      setEstado('listo');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el código.');
      setEstado('error');
    }
  }, [beneficioId]);

  useEffect(() => {
    if (beneficioId) generar();
  }, [beneficioId, generar]);

  // Cuenta regresiva.
  useEffect(() => {
    if (estado !== 'listo' || segundos <= 0) return;
    const t = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [estado, segundos]);

  const expirado = estado === 'listo' && segundos <= 0;

  return (
    <Modal visible={beneficioId != null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.hoja}>
          <View style={styles.barra} />
          <AppText variant="subtitle">{nombre}</AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>
            Muéstrale este código al personal
          </AppText>

          <View style={styles.qrZona}>
            {estado === 'cargando' && <ActivityIndicator color={colors.primary} size="large" />}
            {estado === 'error' && (
              <AppText color={colors.danger} style={styles.centro}>{error}</AppText>
            )}
            {estado === 'listo' && !expirado && (
              <QRCode value={codigo} size={220} backgroundColor="#fff" color={colors.textPrimary} />
            )}
            {expirado && (
              <AppText color={colors.textSecondary} style={styles.centro}>El código expiró.</AppText>
            )}
          </View>

          {estado === 'listo' && !expirado && (
            <AppText variant="subtitle" color={colors.primary}>
              Expira en {segundos}s
            </AppText>
          )}

          {(expirado || estado === 'error') && (
            <AppButton titulo="Generar otro código" onPress={generar} style={styles.boton} />
          )}
          <View style={styles.cerrar}>
            <AppButton titulo="Cerrar" variante="secundario" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  barra: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  sub: { marginTop: spacing.xs, marginBottom: spacing.lg },
  qrZona: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  centro: { textAlign: 'center' },
  boton: { alignSelf: 'stretch', marginTop: spacing.md },
  cerrar: { alignSelf: 'stretch', marginTop: spacing.sm },
});
