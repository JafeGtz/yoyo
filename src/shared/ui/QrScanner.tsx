import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { AppButton } from './AppButton';
import { colors, radii, spacing } from '../theme';

interface Props {
  onScan: (valor: string) => void;
  activo: boolean;
  instruccion: string;
  colorMarco?: string;
}

/** Cámara con lector de QR + overlay (marco) estilo UI Kit. */
export function QrScanner({ onScan, activo, instruccion, colorMarco = colors.primary }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const bloqueado = useRef(false);

  // Al reactivar el escaneo, se permite leer de nuevo.
  useEffect(() => {
    if (activo) bloqueado.current = false;
  }, [activo]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (bloqueado.current || !activo) return;
      const valor = codes[0]?.value;
      if (valor) {
        bloqueado.current = true;
        onScan(valor);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.aviso}>
        <Icon name="camera" size={48} color="#fff" />
        <AppText color="#fff" style={styles.avisoTexto}>
          Necesitamos acceso a tu cámara para escanear.
        </AppText>
        <AppButton titulo="Permitir cámara" onPress={requestPermission} style={styles.avisoBoton} />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.aviso}>
        <AppText color="#fff">No encontramos una cámara en este dispositivo.</AppText>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={activo} codeScanner={codeScanner} />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.tooltip}>
          <AppText variant="caption" color="#fff">{instruccion}</AppText>
        </View>
        <View style={[styles.marco, { borderColor: colorMarco }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  marco: {
    width: 250,
    height: 250,
    borderRadius: radii.xl,
    borderWidth: 4,
  },
  aviso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  avisoTexto: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  avisoBoton: { alignSelf: 'stretch' },
});
