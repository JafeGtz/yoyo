import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const FONDO = '#151833';
const AVATARES = ['#FB3D93', '#F5B731', '#34D6A8', '#7C5CFC', '#00BCD4', '#FF7A59', '#4F3CE0'];
const colorDe = (nombre: string) => AVATARES[[...nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATARES.length];
const inicial = (n: string) => n.charAt(0).toUpperCase();

interface Fila { cliente_id: string; nombre: string; visitas: number }
type Periodo = 'hoy' | 'semana' | 'mes';

export function RankingScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Ranking'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [lista, setLista] = useState<Fila[] | null>(null);

  useEffect(() => {
    let vivo = true;
    setLista(null);
    const ahora = new Date();
    let desde: Date;
    if (periodo === 'hoy') desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    else if (periodo === 'semana') desde = new Date(ahora.getTime() - 7 * 86400000);
    else desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    supabase.rpc('ranking_negocio', { p_negocio_id: params.negocioId, p_desde: desde.toISOString() })
      .then(({ data }) => { if (vivo) setLista((data as Fila[]) ?? []); });
    return () => { vivo = false; };
  }, [periodo, params.negocioId]);

  const top3 = lista?.slice(0, 3) ?? [];
  const resto = lista?.slice(3) ?? [];

  return (
    <View style={styles.fondo}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}><AppText variant="title" color="#fff">‹</AppText></Pressable>
          <AppText variant="subtitle" color="#fff">Top del {periodo === 'mes' ? 'mes' : periodo === 'semana' ? 'semana' : 'día'}</AppText>
          <View style={{ width: 20 }} />
        </View>
        {/* Tabs de periodo */}
        <View style={styles.tabs}>
          {(['hoy', 'semana', 'mes'] as Periodo[]).map(p => (
            <Pressable key={p} onPress={() => setPeriodo(p)} style={[styles.tab, periodo === p && styles.tabOn]}>
              <AppText variant="caption" color={periodo === p ? FONDO : 'rgba(255,255,255,0.6)'} style={styles.bold}>
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
              </AppText>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {lista === null ? (
        <ActivityIndicator color="#fff" style={styles.loader} />
      ) : lista.length === 0 ? (
        <AppText color="rgba(255,255,255,0.6)" style={styles.vacio}>Aún no hay visitas en este periodo.</AppText>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Podio */}
          <View style={styles.podio}>
            <Puesto row={top3[1]} lugar={2} />
            <Puesto row={top3[0]} lugar={1} />
            <Puesto row={top3[2]} lugar={3} />
          </View>

          {/* Lista 4º+ */}
          <View style={styles.hoja}>
            {resto.map((f, i) => {
              const yo = f.cliente_id === perfil?.cliente_id;
              return (
                <View key={f.cliente_id} style={[styles.fila, yo && styles.filaYo]}>
                  <AppText variant="body" color="rgba(255,255,255,0.5)" style={styles.rank}>{i + 4}</AppText>
                  <View style={[styles.avatarMini, { backgroundColor: colorDe(f.nombre) }]}>
                    <AppText variant="caption" color="#fff" style={styles.bold}>{inicial(f.nombre)}</AppText>
                  </View>
                  <AppText variant="body" color="#fff" style={styles.flex} numberOfLines={1}>{f.nombre}{yo ? ' (tú)' : ''}</AppText>
                  <View style={styles.xpFila}>
                    <Icon name="star" size={14} color="#F5B731" />
                    <AppText variant="caption" color="rgba(255,255,255,0.6)" style={styles.bold}>{f.visitas} vis</AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Puesto({ row, lugar }: { row?: Fila; lugar: 1 | 2 | 3 }) {
  if (!row) return <View style={styles.col} />;
  const size = lugar === 1 ? 86 : 64;
  const anillo = lugar === 1 ? '#FB3D93' : lugar === 2 ? '#F5B731' : '#FF7A59';
  const bloqueH = lugar === 1 ? 118 : lugar === 2 ? 84 : 62;
  return (
    <View style={styles.col}>
      {lugar === 1 && <Icon name="crown" size={30} color="#F5B731" />}
      <View style={[styles.anillo, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, borderColor: anillo }]}>
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colorDe(row.nombre) }]}>
          <AppText variant="title" color="#fff">{inicial(row.nombre)}</AppText>
        </View>
      </View>
      <View style={styles.xpPill}>
        <Icon name="star" size={12} color="#F5B731" />
        <AppText variant="caption" color="#F5B731" style={styles.bold}>{row.visitas}</AppText>
      </View>
      <AppText variant="caption" color="#fff" style={[styles.nombrePodio, styles.bold]} numberOfLines={1}>{row.nombre}</AppText>
      <View style={[styles.bloque, { height: bloqueH }, lugar === 1 && styles.bloque1]}>
        <AppText style={styles.bloqueNum}>{lugar}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: FONDO },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  tabs: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 4, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 999 },
  tabOn: { backgroundColor: '#fff' },
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.xl, textAlign: 'center' },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.md, marginTop: spacing.lg },
  col: { flex: 1, alignItems: 'center' },
  anillo: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: -12 },
  nombrePodio: { marginTop: spacing.xs, maxWidth: 100, textAlign: 'center' },
  bloque: {
    width: '86%', marginTop: spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.08)',
  },
  bloque1: { backgroundColor: 'rgba(124,92,252,0.18)', borderColor: 'rgba(124,92,252,0.35)' },
  bloqueNum: { fontSize: 40, fontWeight: '800', color: 'rgba(255,255,255,0.25)' },
  hoja: { backgroundColor: '#1B1E3A', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: spacing.sm, paddingVertical: spacing.sm, minHeight: 300 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  filaYo: { backgroundColor: 'rgba(124,92,252,0.15)' },
  rank: { width: 22 },
  avatarMini: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  xpFila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
