import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

type Estado = 'cargando' | 'listo' | 'rascando' | 'ganador';

const ERRORES: Record<string, string> = {
  sin_premios: 'Este negocio aún no configuró el rasca y gana.',
  nivel_insuficiente: 'Este juego es solo para cierto nivel de clientes.',
  sin_giros: 'Ya jugaste hoy. Vuelve mañana.',
  no_cliente: 'Inicia sesión como cliente para jugar.',
};

export function RascaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Rasca'>>();
  const navigation = useNavigation();
  const foil = useRef(new Animated.Value(1)).current; // 1 = tapado, 0 = rascado

  const [estado, setEstado] = useState<Estado>('cargando');
  const [premios, setPremios] = useState<string[]>([]);
  const [premio, setPremio] = useState<string | null>(null);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    supabase.from('premio_juego').select('nombre')
      .eq('negocio_id', params.negocioId).eq('juego', 'rasca').eq('activo', true)
      .then(({ data }) => {
        if (!vivo) return;
        setPremios((data as { nombre: string }[] ?? []).map(x => x.nombre));
        setEstado('listo');
      });
    return () => { vivo = false; };
  }, [params.negocioId]);

  async function rascar() {
    if (estado === 'rascando' || premios.length === 0) return;
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
    setDetalle(data.canjeable ? '🎁 Ya está en tus beneficios' : data.agotado ? 'Se agotó, ¡sigue participando!' : '');
    // Animación de "rascar": el foil se desvanece revelando el premio.
    Animated.timing(foil, { toValue: 0, duration: 900, useNativeDriver: true }).start(() => setEstado('ganador'));
  }

  const foilOpacity = foil;
  const foilScale = foil.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] });

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Rasca y Gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {estado === 'cargando' ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : premios.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Este negocio aún no configuró el rasca y gana.</AppText>
      ) : (
        <>
          {/* Premios posibles */}
          <AppText variant="caption" color={colors.textSecondary} style={styles.seccion}>Puedes ganar:</AppText>
          <View style={styles.chips}>
            {premios.map((p, i) => (
              <View key={i} style={styles.chip}><AppText variant="caption" color={colors.primary}>{p}</AppText></View>
            ))}
          </View>

          {/* Tarjeta rascable */}
          <Pressable onPress={rascar} disabled={estado !== 'listo'} style={styles.tarjeta}>
            {/* Premio revelado debajo */}
            <View style={styles.premio}>
              <AppText variant="hero">{estado === 'ganador' ? '🎉' : '🎁'}</AppText>
              {estado === 'ganador' && premio ? (
                <>
                  <AppText variant="title" color={colors.primary}>{premio}</AppText>
                  {detalle ? <AppText variant="caption" color={colors.textSecondary}>{detalle}</AppText> : null}
                </>
              ) : (
                <AppText variant="subtitle" color={colors.textSecondary}>¿Qué habrá?</AppText>
              )}
            </View>
            {/* Foil que se rasca */}
            {estado !== 'ganador' && (
              <Animated.View style={[styles.foil, { opacity: foilOpacity, transform: [{ scale: foilScale }] }]}>
                <AppText variant="hero">🪙</AppText>
                <AppText variant="subtitle" color="#fff">{estado === 'rascando' ? 'Rascando…' : 'RASCA AQUÍ'}</AppText>
              </Animated.View>
            )}
          </Pressable>

          {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}

          {estado === 'ganador' ? (
            <AppButton titulo="Listo" onPress={() => navigation.goBack()} style={styles.boton} />
          ) : (
            <AppButton titulo={estado === 'rascando' ? 'Rascando…' : '¡Rascar!'} onPress={rascar} cargando={estado === 'rascando'} style={styles.boton} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl, alignSelf: 'center' },
  seccion: { marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.lavender, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill },
  tarjeta: {
    height: 220, marginTop: spacing.lg, borderRadius: radii.xl, overflow: 'hidden',
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  premio: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg },
  foil: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  error: { marginTop: spacing.md },
  boton: { marginTop: spacing.xl },
});
