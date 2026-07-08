import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { Confetti } from '../../../shared/ui/Confetti';
import { colors, radii, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const { width } = Dimensions.get('window');
const W = Math.min(width - 48, 340);
const H = 190;
const RAD = 22;   // radio del rascado
const META = 34;  // rasguños para revelar (hay que rascar buena parte)

const ERRORES: Record<string, string> = {
  sin_premios: 'Este negocio aún no configuró el rasca y gana.',
  nivel_insuficiente: 'Este juego es solo para cierto nivel de clientes.',
  sin_giros: 'Ya jugaste hoy. Vuelve mañana.',
  no_cliente: 'Inicia sesión como cliente para jugar.',
};

export function RascaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Rasca'>>();
  const navigation = useNavigation();

  const [premios, setPremios] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [premio, setPremio] = useState<string | null>(null);
  const [detalle, setDetalle] = useState('');
  const [gano, setGano] = useState(false);
  const [error, setError] = useState('');
  const [puntos, setPuntos] = useState<{ x: number; y: number }[]>([]);
  const [revelado, setRevelado] = useState(false);
  const [confeti, setConfeti] = useState(false);

  const iniciado = useRef(false);
  const reveladoRef = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase.from('premio_juego').select('nombre')
      .eq('negocio_id', params.negocioId).eq('juego', 'rasca').eq('activo', true)
      .then(({ data }) => {
        if (!vivo) return;
        setPremios((data as { nombre: string }[] ?? []).map(x => x.nombre));
        setCargando(false);
      });
    return () => { vivo = false; };
  }, [params.negocioId]);

  async function comenzar() {
    if (iniciado.current) return;
    iniciado.current = true;
    const { data, error: e } = await supabase.functions.invoke('girar-juego', {
      body: { negocio_id: params.negocioId, juego: 'rasca' },
    });
    if (e || data?.error) {
      setError(ERRORES[data?.error as string] ?? 'No se pudo jugar. Intenta de nuevo.');
      revelar();
      return;
    }
    setPremio(data.premio);
    setGano(!!data.canjeable);
    setDetalle(data.canjeable ? '🎁 Ya está en tus beneficios' : data.agotado ? 'Se agotó esta vez 😅' : '');
  }

  function revelar() {
    if (reveladoRef.current) return;
    reveladoRef.current = true;
    setRevelado(true);
  }

  // El confeti salta cuando ya se reveló Y sabemos que ganó (la API es async).
  useEffect(() => {
    if (revelado && gano) setConfeti(true);
  }, [revelado, gano]);

  function agregar(x: number, y: number) {
    const u = ultimo.current;
    if (u && Math.hypot(x - u.x, y - u.y) < 14) return;
    ultimo.current = { x, y };
    setPuntos(prev => {
      const next = [...prev, { x, y }];
      if (next.length === META) revelar();
      return next;
    });
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => { comenzar(); agregar(e.nativeEvent.locationX, e.nativeEvent.locationY); },
      onPanResponderMove: e => agregar(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;

  return (
    <Screen scroll>
      {confeti && <Confetti />}
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Rasca y Gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {cargando ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : premios.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Este negocio aún no configuró el rasca y gana.</AppText>
      ) : (
        <>
          <AppText variant="caption" color={colors.textSecondary} style={styles.seccion}>Puedes ganar:</AppText>
          <View style={styles.chips}>
            {premios.map((p, i) => (
              <View key={i} style={styles.chip}><AppText variant="caption" color={colors.primary}>{p}</AppText></View>
            ))}
          </View>

          {/* Tarjeta rascable */}
          <View style={styles.area}>
            <View style={styles.premio}>
              {error ? (
                <AppText color={colors.danger} style={styles.center}>{error}</AppText>
              ) : (
                <>
                  <AppText variant="hero">{revelado ? (gano ? '🎉' : '🍀') : '🎁'}</AppText>
                  {premio ? (
                    <>
                      {revelado && (
                        <AppText variant="subtitle" color={gano ? colors.mint : colors.textSecondary}>
                          {gano ? '¡Ganaste!' : '¡Casi!'}
                        </AppText>
                      )}
                      <AppText variant="title" color={gano ? colors.primary : colors.textSecondary}>{premio}</AppText>
                      {detalle ? <AppText variant="caption" color={colors.textSecondary}>{detalle}</AppText> : null}
                    </>
                  ) : (
                    <AppText variant="subtitle" color={colors.textSecondary}>¿Qué habrá?</AppText>
                  )}
                </>
              )}
            </View>

            {!revelado && (
              <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
                <Svg width={W} height={H}>
                  <Defs>
                    <Mask id="scratch">
                      <Rect x={0} y={0} width={W} height={H} rx={20} fill="white" />
                      {puntos.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={RAD} fill="black" />)}
                    </Mask>
                  </Defs>
                  <G mask="url(#scratch)">
                    <Rect x={0} y={0} width={W} height={H} rx={20} fill={colors.primary} />
                    <SvgText x={W / 2} y={H / 2} fill="#fff" fontSize={17} fontWeight="700" textAnchor="middle">RASCA CON EL DEDO 🪙</SvgText>
                  </G>
                </Svg>
              </View>
            )}
          </View>

          {revelado ? (
            <AppButton titulo="Listo" onPress={() => navigation.goBack()} style={styles.boton} />
          ) : (
            <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>👆 Desliza el dedo para rascar</AppText>
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
  area: {
    width: W, height: H, alignSelf: 'center', marginTop: spacing.lg,
    borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface,
  },
  premio: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.lg },
  center: { textAlign: 'center' },
  boton: { marginTop: spacing.xl },
  hint: { marginTop: spacing.lg, textAlign: 'center' },
});
