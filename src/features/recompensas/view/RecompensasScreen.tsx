import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

interface Recompensa {
  id: string;
  nombre: string;
  tipo: string; // condicion_tipo: visitas | monto | combinado
  visitas: number | null;
  monto: number | null;
  desbloqueado: boolean;
  requisito: string;
  falta: string | null;
  orden: number;
}

export function RecompensasScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Recompensas'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [lista, setLista] = useState<Recompensa[] | null>(null);
  const [vis, setVis] = useState(0);
  const [mon, setMon] = useState(0);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    (async () => {
      const [{ data: bens }, { data: cn }] = await Promise.all([
        supabase.from('beneficio')
          .select('id, nombre, condicion_tipo, condicion_visitas, condicion_monto')
          .eq('negocio_id', params.negocioId).eq('estado', 'activo'),
        supabase.from('cliente_negocio').select('visitas_totales, monto_acumulado')
          .eq('negocio_id', params.negocioId).eq('cliente_id', cid).maybeSingle(),
      ]);
      if (!vivo) return;
      const v = (cn as { visitas_totales: number } | null)?.visitas_totales ?? 0;
      const m = Number((cn as { monto_acumulado: number } | null)?.monto_acumulado ?? 0);
      setVis(v); setMon(m);

      const rows: Recompensa[] = ((bens as { id: string; nombre: string; condicion_tipo: string; condicion_visitas: number | null; condicion_monto: number | null }[]) ?? [])
        .map(b => {
          const cv = b.condicion_visitas, cm = b.condicion_monto;
          const usaV = b.condicion_tipo === 'visitas' || b.condicion_tipo === 'combinado';
          const usaM = b.condicion_tipo === 'monto' || b.condicion_tipo === 'combinado';
          const okV = !usaV || (cv != null && v >= cv);
          const okM = !usaM || (cm != null && m >= cm);
          const req: string[] = [];
          if (usaV && cv != null) req.push(`${cv} visitas`);
          if (usaM && cm != null) req.push(`$${cm}`);
          const faltas: string[] = [];
          if (usaV && cv != null && v < cv) faltas.push(`${cv - v} visita${cv - v === 1 ? '' : 's'}`);
          if (usaM && cm != null && m < cm) faltas.push(`$${cm - m}`);
          return {
            id: b.id, nombre: b.nombre, tipo: b.condicion_tipo, visitas: cv, monto: cm,
            desbloqueado: okV && okM,
            requisito: req.join(' + '),
            falta: faltas.length ? `Te falta${faltas.length > 1 ? 'n' : ''} ${faltas.join(' y ')}` : null,
            orden: cv ?? (cm != null ? cm / 50 : 0), // aprox para ordenar
          };
        })
        .sort((a, b) => a.orden - b.orden);
      setLista(rows);
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id, params.negocioId]);

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Tu camino de recompensas</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>
      <View style={styles.resumen}>
        <View style={styles.pill}><AppText variant="caption" color={colors.primary}>🔵 {vis} visitas</AppText></View>
        <View style={styles.pill}><AppText variant="caption" color={colors.primary}>💰 ${mon.toLocaleString('es-MX')}</AppText></View>
      </View>

      {lista === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : lista.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Este negocio aún no tiene recompensas.</AppText>
      ) : (
        <View style={styles.timeline}>
          {lista.map((r, i) => (
            <View key={r.id} style={styles.fila}>
              {/* Riel: punto + línea */}
              <View style={styles.riel}>
                <View style={[styles.dot, r.desbloqueado ? styles.dotOn : styles.dotOff]}>
                  <AppText variant="caption" color="#fff">{r.desbloqueado ? '✓' : '🔒'}</AppText>
                </View>
                {i < lista.length - 1 && <View style={styles.linea} />}
              </View>
              {/* Contenido */}
              <View style={[styles.card, r.desbloqueado && styles.cardOn]}>
                <AppText variant="subtitle" color={r.desbloqueado ? colors.textPrimary : colors.textSecondary}>{r.nombre}</AppText>
                <View style={styles.reqRow}>
                  <View style={styles.reqPill}><AppText variant="caption" color={colors.textSecondary}>{r.requisito}</AppText></View>
                  {r.desbloqueado
                    ? <AppText variant="caption" color={colors.mint} style={styles.bold}>¡Desbloqueado! 🎉</AppText>
                    : <AppText variant="caption" color={colors.textSecondary}>{r.falta}</AppText>}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const DOT = 34;
const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  resumen: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pill: { backgroundColor: colors.lavender, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill },
  loader: { marginTop: spacing.xl, alignSelf: 'center' },
  timeline: { marginTop: spacing.lg },
  fila: { flexDirection: 'row' },
  riel: { width: DOT, alignItems: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.mint },
  dotOff: { backgroundColor: colors.textSecondary },
  linea: { flex: 1, width: 3, backgroundColor: colors.border, marginVertical: 2 },
  card: { flex: 1, marginLeft: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md },
  cardOn: { backgroundColor: colors.mintSoft },
  reqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, flexWrap: 'wrap', gap: spacing.xs },
  reqPill: { backgroundColor: '#fff', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
  bold: { fontWeight: '700' },
});
