import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Text as SvgText, Circle, Polygon } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

type Estado = 'cargando' | 'listo' | 'girando' | 'resultado';

const ERRORES: Record<string, string> = {
  sin_premios: 'Este negocio aún no configuró la ruleta.',
  nivel_insuficiente: 'Este juego es solo para cierto nivel de clientes.',
  sin_giros: 'Ya jugaste hoy. Vuelve mañana.',
  no_cliente: 'Inicia sesión como cliente para jugar.',
};

// Colores vibrantes para los gajos de la rueda.
const GAJOS = ['#4F3CE0', '#34D6A8', '#FB3D93', '#F5B731', '#7C5CFC', '#00BCD4', '#FF7A59', '#9B5DE5'];

const SIZE = 300;
const R = SIZE / 2;

function punto(cx: number, cy: number, r: number, grados: number) {
  const rad = (grados * Math.PI) / 180; // 0 = arriba, sentido horario
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}
function gajoPath(cx: number, cy: number, r: number, d0: number, d1: number) {
  const p0 = punto(cx, cy, r, d0);
  const p1 = punto(cx, cy, r, d1);
  const large = d1 - d0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
}

export function RuletaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Ruleta'>>();
  const navigation = useNavigation();
  const anim = useRef(new Animated.Value(0)).current;
  const rotRef = useRef(0);

  const [estado, setEstado] = useState<Estado>('cargando');
  const [premios, setPremios] = useState<string[]>([]);
  const [premio, setPremio] = useState<string | null>(null);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    supabase.from('premio_juego').select('nombre')
      .eq('negocio_id', params.negocioId).eq('juego', 'ruleta').eq('activo', true)
      .then(({ data }) => {
        if (!vivo) return;
        const p = (data as { nombre: string }[] ?? []).map(x => x.nombre);
        setPremios(p);
        setEstado(p.length === 0 ? 'listo' : 'listo');
      });
    return () => { vivo = false; };
  }, [params.negocioId]);

  const n = premios.length || 1;
  const seg = 360 / n;
  const rotacion = anim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  async function girar() {
    if (premios.length === 0) return;
    setEstado('girando');
    setError('');

    const { data, error: e } = await supabase.functions.invoke('girar-juego', {
      body: { negocio_id: params.negocioId, juego: 'ruleta' },
    });
    if (e || data?.error) {
      setError(ERRORES[data?.error as string] ?? 'No se pudo girar. Intenta de nuevo.');
      setEstado('listo');
      return;
    }

    const idx = Math.max(0, premios.indexOf(data.premio));
    const medio = idx * seg + seg / 2;
    const objetivo = ((360 - medio) % 360 + 360) % 360;
    const actual = ((rotRef.current % 360) + 360) % 360;
    let delta = objetivo - actual; if (delta < 0) delta += 360;
    const final = rotRef.current + 360 * 5 + delta;
    rotRef.current = final;

    Animated.timing(anim, { toValue: final, duration: 4200, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => {
        setPremio(data.premio);
        setDetalle(data.canjeable ? '🎁 Ya está en tus beneficios' : data.agotado ? 'Se agotó, ¡sigue participando!' : '');
        setEstado('resultado');
      });
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Gira y Gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {estado === 'cargando' ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : premios.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Este negocio aún no configuró la ruleta.</AppText>
      ) : (
        <View style={styles.centro}>
          {/* Puntero */}
          <Svg width={40} height={28} style={styles.puntero}>
            <Polygon points="20,28 4,0 36,0" fill={colors.textPrimary} />
          </Svg>

          {/* Rueda */}
          <Animated.View style={{ transform: [{ rotate: rotacion }] }}>
            <Svg width={SIZE} height={SIZE}>
              {premios.map((p, i) => {
                const d0 = i * seg;
                const d1 = (i + 1) * seg;
                const mid = d0 + seg / 2;
                const tp = punto(R, R, R * 0.62, mid);
                return (
                  <G key={i}>
                    <Path d={gajoPath(R, R, R - 4, d0, d1)} fill={GAJOS[i % GAJOS.length]} stroke="#fff" strokeWidth={2} />
                    <SvgText
                      x={tp.x} y={tp.y} fill="#fff" fontSize={13} fontWeight="700"
                      textAnchor="middle" transform={`rotate(${mid} ${tp.x} ${tp.y})`}
                    >
                      {p.length > 12 ? p.slice(0, 11) + '…' : p}
                    </SvgText>
                  </G>
                );
              })}
              <Circle cx={R} cy={R} r={26} fill="#fff" stroke={colors.primary} strokeWidth={4} />
              <SvgText x={R} y={R + 6} fontSize={20} textAnchor="middle">🎡</SvgText>
            </Svg>
          </Animated.View>

          {estado === 'resultado' && premio && (
            <View style={styles.resultado}>
              <AppText variant="hero">🎉</AppText>
              <AppText variant="title" color={colors.primary}>¡Ganaste!</AppText>
              <AppText variant="subtitle">{premio}</AppText>
              {detalle ? <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>{detalle}</AppText> : null}
            </View>
          )}
          {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}
        </View>
      )}

      {premios.length > 0 && (
        estado === 'resultado' ? (
          <AppButton titulo="Listo" onPress={() => navigation.goBack()} style={styles.boton} />
        ) : (
          <AppButton titulo={estado === 'girando' ? 'Girando…' : '¡Girar!'} onPress={girar} cargando={estado === 'girando'} style={styles.boton} />
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl, alignSelf: 'center' },
  centro: { alignItems: 'center', marginTop: spacing.lg },
  puntero: { zIndex: 2, marginBottom: -6 },
  resultado: { alignItems: 'center', marginTop: spacing.xl },
  error: { marginTop: spacing.lg },
  boton: { marginTop: spacing.xl },
});
