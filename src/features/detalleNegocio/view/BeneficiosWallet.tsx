import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { acentos, radii, spacing } from '../../../shared/theme';

const CARD_W = 268;
const GAP = 14;
const SNAP = CARD_W + GAP;

interface Beneficio { id: string; nombre: string; vence_en: string | null }

/** Carrusel de beneficios tipo billetera: tarjetas coloridas que se arrastran
 *  de lado con animación (la centrada crece, las de los lados se encogen). */
export function BeneficiosWallet({ beneficios, onUsar }: {
  beneficios: Beneficio[];
  onUsar: (b: { id: string; nombre: string }) => void;
}) {
  const scrollX = useRef(new Animated.Value(0)).current;
  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP}
      decelerationRate="fast"
      contentContainerStyle={styles.contenido}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
    >
      {beneficios.map((b, i) => {
        const ac = acentos[i % acentos.length];
        const rango = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
        const scale = scrollX.interpolate({ inputRange: rango, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' });
        const opacity = scrollX.interpolate({ inputRange: rango, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' });
        const vence = b.vence_en ? new Date(b.vence_en).toLocaleDateString('es-MX') : null;
        return (
          <Animated.View key={b.id} style={[styles.card, { backgroundColor: ac.fuerte, transform: [{ scale }], opacity }]}>
            <View style={styles.bgIcon}><Icon name="gift" size={130} color="rgba(255,255,255,0.13)" /></View>
            <View style={styles.top}>
              <Icon name="ticket" size={20} color="#fff" />
              <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.bold}>BENEFICIO</AppText>
            </View>
            <AppText variant="title" color="#fff" numberOfLines={2} style={styles.nombre}>{b.nombre}</AppText>
            <View style={styles.bottom}>
              {vence
                ? <AppText variant="caption" color="rgba(255,255,255,0.85)">Vence {vence}</AppText>
                : <View />}
              <Pressable style={styles.usar} onPress={() => onUsar({ id: b.id, nombre: b.nombre })}>
                <AppText variant="caption" color={ac.fuerte} style={styles.bold}>Usar ahora</AppText>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingVertical: spacing.sm, paddingRight: spacing.lg },
  card: {
    width: CARD_W, height: 158, borderRadius: 22, padding: spacing.lg, marginRight: GAP,
    overflow: 'hidden', justifyContent: 'space-between',
    shadowColor: '#1B1B2F', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  bgIcon: { position: 'absolute', right: -18, bottom: -22 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nombre: { marginTop: spacing.xs },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usar: { backgroundColor: '#fff', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  bold: { fontWeight: '700' },
});
