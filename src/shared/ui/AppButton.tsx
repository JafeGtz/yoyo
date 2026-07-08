import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, radii, spacing } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  cargando?: boolean;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  icono?: IconName;
  style?: ViewStyle;
}

export function AppButton({ titulo, onPress, cargando, variante = 'primario', deshabilitado, icono, style }: Props) {
  const esPrimario = variante === 'primario';
  const colorTexto = esPrimario ? '#fff' : colors.primary;
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
        <ActivityIndicator color={colorTexto} />
      ) : (
        <View style={styles.fila}>
          {icono && <Icon name={icono} size={20} color={colorTexto} />}
          <AppText variant="subtitle" color={colorTexto}>{titulo}</AppText>
        </View>
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
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primario: { backgroundColor: colors.primary },
  secundario: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  presionado: { opacity: 0.85 },
  deshabilitado: { opacity: 0.5 },
});
