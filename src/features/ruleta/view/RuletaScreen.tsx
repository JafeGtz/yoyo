import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

type Estado = 'listo' | 'girando' | 'resultado';

export function RuletaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Ruleta'>>();
  const navigation = useNavigation();
  const giro = useRef(new Animated.Value(0)).current;
  const vueltas = useRef(0);
  const [estado, setEstado] = useState<Estado>('listo');
  const [premio, setPremio] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function girar() {
    setEstado('girando');
    setError('');

    // Pide el premio al servidor (selección ponderada).
    const { data, error: e } = await supabase.functions.invoke('girar-juego', {
      body: { negocio_id: params.negocioId, juego: 'ruleta' },
    });

    // Anima la rueda (~3.5s) en paralelo.
    vueltas.current += 6 + Math.random() * 2;
    Animated.timing(giro, {
      toValue: vueltas.current,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (e || data?.error) {
        setError(data?.error === 'sin_premios' ? 'Este negocio aún no configuró la ruleta.' : 'No se pudo girar. Intenta de nuevo.');
        setEstado('listo');
      } else {
        setPremio(data.premio);
        setEstado('resultado');
      }
    });
  }

  const rotacion = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Gira y Gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      <View style={styles.centro}>
        {/* Indicador */}
        <AppText variant="title" color={colors.primary} style={styles.flecha}>▼</AppText>
        {/* Rueda */}
        <Animated.View style={[styles.rueda, { transform: [{ rotate: rotacion }] }]}>
          <AppText variant="hero">🎡</AppText>
        </Animated.View>

        {estado === 'resultado' && premio && (
          <View style={styles.resultado}>
            <AppText variant="hero">🎉</AppText>
            <AppText variant="title" color={colors.primary}>¡Ganaste!</AppText>
            <AppText variant="subtitle">{premio}</AppText>
          </View>
        )}
        {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}
      </View>

      {estado === 'resultado' ? (
        <AppButton titulo="Listo" onPress={() => navigation.goBack()} />
      ) : (
        <AppButton titulo={estado === 'girando' ? 'Girando…' : '¡Girar!'} onPress={girar} cargando={estado === 'girando'} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flecha: { marginBottom: -8, zIndex: 2 },
  rueda: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: colors.lavender,
    borderWidth: 8, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  resultado: { alignItems: 'center', marginTop: spacing.xl },
  error: { marginTop: spacing.lg },
});
