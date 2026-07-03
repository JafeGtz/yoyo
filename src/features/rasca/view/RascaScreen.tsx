import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

type Estado = 'listo' | 'rascando' | 'resultado';

const ERRORES: Record<string, string> = {
  sin_premios: 'Este negocio aún no configuró el rasca y gana.',
  nivel_insuficiente: 'Este juego es solo para cierto nivel de clientes.',
  sin_giros: 'Ya jugaste hoy. Vuelve mañana.',
  no_cliente: 'Inicia sesión como cliente para jugar.',
};

export function RascaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Rasca'>>();
  const navigation = useNavigation();
  const [estado, setEstado] = useState<Estado>('listo');
  const [premio, setPremio] = useState<string | null>(null);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState('');

  async function rascar() {
    setEstado('rascando');
    setError('');
    const { data, error: e } = await supabase.functions.invoke('girar-juego', {
      body: { negocio_id: params.negocioId, juego: 'rasca' },
    });
    if (e || data?.error) {
      setError(ERRORES[data?.error as string] ?? 'No se pudo jugar. Intenta de nuevo.');
      setEstado('listo');
      return;
    }
    setPremio(data.premio);
    setDetalle(data.canjeable ? '🎁 Ya está en tus beneficios' : data.agotado ? 'El premio se agotó, ¡sigue participando!' : '');
    setEstado('resultado');
  }

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Rasca y Gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      <View style={styles.centro}>
        {estado === 'resultado' && premio ? (
          <View style={styles.tarjeta}>
            <AppText variant="hero">🎉</AppText>
            <AppText variant="title" color={colors.primary}>¡Ganaste!</AppText>
            <AppText variant="subtitle">{premio}</AppText>
            {detalle ? <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>{detalle}</AppText> : null}
          </View>
        ) : (
          <Pressable onPress={rascar} disabled={estado === 'rascando'} style={styles.tarjetaTapada}>
            <AppText variant="hero">{estado === 'rascando' ? '✨' : '🪙'}</AppText>
            <AppText variant="subtitle" color="#fff">{estado === 'rascando' ? 'Rascando…' : 'Toca para rascar'}</AppText>
          </Pressable>
        )}
        {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}
      </View>

      {estado === 'resultado' ? (
        <AppButton titulo="Listo" onPress={() => navigation.goBack()} />
      ) : (
        <AppButton titulo={estado === 'rascando' ? 'Rascando…' : '¡Rascar!'} onPress={rascar} cargando={estado === 'rascando'} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { alignItems: 'center' },
  tarjetaTapada: {
    width: 240, height: 160, borderRadius: radii.xl,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  error: { marginTop: spacing.lg },
});
