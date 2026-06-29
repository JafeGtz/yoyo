import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Color de fondo de la pantalla. */
  bg?: string;
  /** Si true, el contenido es desplazable. */
  scroll?: boolean;
  /** Si false, quita el padding horizontal/vertical. */
  padded?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
}

/** Contenedor base de pantalla: área segura + padding consistente. */
export function Screen({ children, bg = colors.background, scroll, padded = true, style, edges }: Props) {
  const contenido = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contenido, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contenido, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  // paddingBottom amplio para que el contenido no quede bajo el tab bar flotante.
  padded: { padding: spacing.lg, paddingBottom: 110 },
});
