import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { acentos, radii, spacing } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const H = 150;      // alto de cada tarjeta
const PEEK = 62;    // parte visible de cada tarjeta cuando están apiladas

export interface WalletItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  vence_en: string | null;
}

/** Pila de tarjetas estilo Apple Wallet: apiladas (asomando) y al tocar se
 *  despliegan/recogen con animación. Reutilizable (beneficios, premios…). */
export function WalletStack({ items, onUsar, textoUsar = 'Usar ahora' }: {
  items: WalletItem[];
  onUsar: (b: { id: string; nombre: string }) => void;
  textoUsar?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbierto(a => !a);
  };

  return (
    <View>
      {items.map((b, i) => {
        const ac = acentos[i % acentos.length];
        const vence = b.vence_en ? new Date(b.vence_en).toLocaleDateString('es-MX') : null;
        const marginTop = i === 0 ? 0 : abierto ? spacing.md : -(H - PEEK);
        return (
          <Pressable
            key={b.id}
            onPress={toggle}
            style={[styles.card, { backgroundColor: ac.fuerte, marginTop, zIndex: i, elevation: 2 + i }]}
          >
            <View style={styles.bgIcon}><Icon name="gift" size={130} color="rgba(255,255,255,0.13)" /></View>
            <View style={styles.top}>
              <View style={styles.topIzq}>
                <Icon name="ticket" size={20} color="#fff" />
                <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.bold}>
                  {b.subtitulo ?? 'BENEFICIO'}
                </AppText>
              </View>
              {vence ? <AppText variant="caption" color="rgba(255,255,255,0.8)">Vence {vence}</AppText> : null}
            </View>
            <AppText variant="subtitle" color="#fff" numberOfLines={1} style={styles.titulo}>{b.titulo}</AppText>

            {/* Sólo la tarjeta desplegada (o la de arriba) muestra el botón */}
            <View style={styles.bottom}>
              <Pressable style={styles.usar} onPress={() => onUsar({ id: b.id, nombre: b.titulo })}>
                <AppText variant="caption" color={ac.fuerte} style={styles.bold}>{textoUsar}</AppText>
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      {items.length > 1 && (
        <Pressable onPress={toggle} style={styles.toggle}>
          <AppText variant="caption" color={acentos[0].fuerte} style={styles.bold}>
            {abierto ? 'Recoger' : `Ver los ${items.length}`}
          </AppText>
          <Icon name="chevron" size={14} color={acentos[0].fuerte} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: H, borderRadius: 22, padding: spacing.lg, overflow: 'hidden', justifyContent: 'space-between',
    shadowColor: '#1B1B2F', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  bgIcon: { position: 'absolute', right: -18, bottom: -22 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topIzq: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titulo: { marginTop: spacing.xs },
  bottom: { flexDirection: 'row' },
  usar: { backgroundColor: '#fff', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.md },
  bold: { fontWeight: '700' },
});
