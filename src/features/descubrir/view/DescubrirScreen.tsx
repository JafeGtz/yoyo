import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppInput } from '../../../shared/ui/AppInput';
import { SoftCard } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/theme';
import { useDescubrirViewModel } from '../viewmodel/useDescubrirViewModel';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

export function DescubrirScreen() {
  const navigation = useNavigation<NavigationProp<ConsumidorStackParams>>();
  const { state } = useDescubrirViewModel();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);

  const negocios = useMemo(() => (state.status === 'listo' ? state.negocios : []), [state]);
  const categorias = useMemo(() => [...new Set(negocios.map(n => n.tipo))], [negocios]);

  const filtrados = negocios.filter(n => {
    const coincideTexto = `${n.nombre} ${n.tipo}`.toLowerCase().includes(q.toLowerCase());
    const coincideCat = !categoria || n.tipo === categoria;
    return coincideTexto && coincideCat;
  });

  return (
    <Screen scroll>
      <AppText variant="title">Descubrir</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
        Encuentra negocios de la red y sus ofertas.
      </AppText>

      <View style={styles.buscador}>
        <AppInput placeholder="Buscar negocio o categoría…" value={q} onChangeText={setQ} />
      </View>

      {categorias.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Todos" activo={!categoria} onPress={() => setCategoria(null)} />
          {categorias.map(c => (
            <Chip key={c} label={c} activo={categoria === c} onPress={() => setCategoria(c)} />
          ))}
        </ScrollView>
      )}

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}
      {state.status === 'listo' && filtrados.length === 0 && (
        <AppText color={colors.textSecondary} style={styles.vacio}>Sin resultados.</AppText>
      )}

      {filtrados.map(n => (
        <Pressable key={n.id} onPress={() => navigation.navigate('DetalleNegocio', { negocioId: n.id, nombre: n.nombre })}>
          <SoftCard style={styles.item}>
            <View style={styles.logo}>
              <AppText variant="subtitle" color="#fff">{n.nombre.charAt(0).toUpperCase()}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="subtitle">{n.nombre}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {n.tipo}{n.direccion ? ` · ${n.direccion}` : ''}
              </AppText>
            </View>
            <AppText variant="subtitle" color={colors.textSecondary}>›</AppText>
          </SoftCard>
        </Pressable>
      ))}
    </Screen>
  );
}

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo ? styles.chipOn : styles.chipOff]}>
      <AppText variant="caption" color={activo ? '#fff' : colors.textSecondary} style={styles.bold}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  buscador: { marginTop: spacing.lg },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  chip: { borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.primary },
  chipOff: { backgroundColor: colors.surface },
  bold: { fontWeight: '700' },
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  logo: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  flex: { flex: 1 },
});
