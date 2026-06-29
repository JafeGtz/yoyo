import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  cargando?: boolean;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  style?: ViewStyle;
}

export function AppButton({ titulo, onPress, cargando, variante = 'primario', deshabilitado, style }: Props) {
  const esPrimario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando || deshabilitado}
      style={({ pressed }) => [
        styles.base,
        esPrimario ? styles.primario : styles.secundario,
        pressed && styles.presionado,
        (cargando || deshabilitado) && styles.deshabilitado,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={esPrimario ? '#fff' : colors.primary} />
      ) : (
        <AppText variant="subtitle" color={esPrimario ? '#fff' : colors.primary}>
          {titulo}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primario: { backgroundColor: colors.primary },
  secundario: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  presionado: { opacity: 0.85 },
  deshabilitado: { opacity: 0.5 },
});
