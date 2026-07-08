import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { acentos, colors, radii, spacing } from '../../../shared/theme';

export interface CatalogoItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  foto_url: string | null;
}

// Alturas variadas para el efecto escalonado (masonry).
const ALTURAS = [150, 108, 128, 98];

/** Cuadrícula escalonada tipo masonry (2 columnas, tarjetas de distinta altura). */
export function CatalogoGrid({ items }: { items: CatalogoItem[] }) {
  const cols: { it: CatalogoItem; i: number }[][] = [[], []];
  items.forEach((it, i) => cols[i % 2].push({ it, i }));
  return (
    <View style={styles.masonry}>
      {cols.map((col, ci) => (
        <View key={ci} style={styles.col}>
          {col.map(({ it, i }) => <Producto key={it.id} it={it} i={i} />)}
        </View>
      ))}
    </View>
  );
}

function Producto({ it, i }: { it: CatalogoItem; i: number }) {
  const ac = acentos[i % acentos.length];
  const h = ALTURAS[i % ALTURAS.length];
  return (
    <View style={[styles.card, { backgroundColor: ac.suave }]}>
      <View style={[styles.foto, { height: h }]}>
        {it.foto_url
          ? <Image source={{ uri: it.foto_url }} style={styles.fotoImg} resizeMode="cover" />
          : <Icon name="bag" size={40} color={ac.fuerte} />}
      </View>
      <AppText variant="subtitle" numberOfLines={2}>{it.nombre}</AppText>
      {it.descripcion ? (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>{it.descripcion}</AppText>
      ) : null}
      {it.precio != null && (
        <AppText variant="subtitle" color={ac.fuerte} style={styles.precio}>${it.precio}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  masonry: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  col: { flex: 1, gap: spacing.md },
  card: { borderRadius: radii.lg, padding: spacing.md, gap: 4 },
  foto: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fotoImg: { width: '100%', height: '100%' },
  precio: { marginTop: 2 },
});
