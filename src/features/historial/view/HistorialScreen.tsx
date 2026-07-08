import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const VERDE = '#34D6A8';
const VERDE_SUAVE = '#DAF6EE';
const VERDE_OSCURO = '#159A78';

interface Visita { id: string; creado_en: string; monto: number | null }

export function HistorialScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Historial'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [visitas, setVisitas] = useState<Visita[] | null>(null);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    supabase.from('visita')
      .select('id, creado_en, monto')
      .eq('negocio_id', params.negocioId).eq('cliente_id', cid)
      .order('creado_en', { ascending: false })
      .then(({ data }) => { if (vivo) setVisitas((data as Visita[]) ?? []); });
    return () => { vivo = false; };
  }, [perfil?.cliente_id, params.negocioId]);

  const total = visitas?.length ?? 0;
  const gastado = (visitas ?? []).reduce((s, v) => s + Number(v.monto ?? 0), 0);

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={VERDE_OSCURO}>‹</AppText>
      </Pressable>
      <AppText variant="title">Tu historial</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {visitas === null ? (
        <ActivityIndicator color={VERDE} style={styles.loader} />
      ) : total === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Aún no tienes visitas aquí.</AppText>
      ) : (
        <>
          {/* Resumen en verde pastel */}
          <View style={styles.resumen}>
            <View style={styles.stat}>
              <AppText variant="title" color={VERDE_OSCURO}>{total}</AppText>
              <AppText variant="caption" color={VERDE_OSCURO}>visita{total === 1 ? '' : 's'}</AppText>
            </View>
            <View style={styles.divVert} />
            <View style={styles.stat}>
              <AppText variant="title" color={VERDE_OSCURO}>${gastado.toLocaleString('es-MX')}</AppText>
              <AppText variant="caption" color={VERDE_OSCURO}>en total</AppText>
            </View>
          </View>

          {/* Línea de tiempo verde */}
          <View style={styles.timeline}>
            {visitas.map((v, i) => (
              <View key={v.id} style={styles.fila}>
                <View style={styles.riel}>
                  <View style={styles.dot}><Icon name="check" size={16} color="#fff" /></View>
                  {i < visitas.length - 1 && <View style={styles.linea} />}
                </View>
                <View style={styles.card}>
                  <View style={styles.flex}>
                    <AppText variant="subtitle" color={VERDE_OSCURO}>Visita #{total - i}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {new Date(v.creado_en).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </AppText>
                  </View>
                  {v.monto != null && <AppText variant="subtitle" color={VERDE_OSCURO}>${v.monto}</AppText>}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const DOT = 34;
const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl },
  flex: { flex: 1 },
  resumen: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: VERDE_SUAVE, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg,
  },
  stat: { alignItems: 'center' },
  divVert: { width: 1, height: 36, backgroundColor: 'rgba(21,154,120,0.25)' },
  timeline: { marginTop: spacing.lg },
  fila: { flexDirection: 'row' },
  riel: { width: DOT, alignItems: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: VERDE, alignItems: 'center', justifyContent: 'center' },
  linea: { flex: 1, width: 3, backgroundColor: VERDE_SUAVE, marginVertical: 2 },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md, marginBottom: spacing.md,
    backgroundColor: VERDE_SUAVE, borderRadius: radii.lg, padding: spacing.md,
  },
});
