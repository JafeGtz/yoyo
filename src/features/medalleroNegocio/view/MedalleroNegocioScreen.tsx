import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { iconoDeLogro } from '../../../shared/ui/insigniaIcono';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

interface Logro { id: string; nombre: string; descripcion: string | null; icono: string | null; obtenida: boolean }

export function MedalleroNegocioScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'MedalleroNegocio'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [lista, setLista] = useState<Logro[] | null>(null);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    let vivo = true;
    (async () => {
      const [obt, glob, prop] = await Promise.all([
        cid ? supabase.from('insignia_obtenida').select('logro_id').eq('cliente_id', cid) : Promise.resolve({ data: [] }),
        supabase.from('logro').select('id, nombre, descripcion, icono').eq('ambito', 'global').eq('activo', true),
        supabase.from('logro').select('id, nombre, descripcion, icono').eq('ambito', 'negocio').eq('negocio_id', params.negocioId).eq('activo', true),
      ]);
      if (!vivo) return;
      const ganados = new Set(((obt.data as { logro_id: string }[]) ?? []).map(o => o.logro_id));
      const base = [...((prop.data as Omit<Logro, 'obtenida'>[]) ?? []), ...((glob.data as Omit<Logro, 'obtenida'>[]) ?? [])];
      const filas = base.map(l => ({ ...l, obtenida: ganados.has(l.id) }))
        .sort((a, b) => Number(b.obtenida) - Number(a.obtenida));
      setLista(filas);
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id, params.negocioId]);

  const total = lista?.length ?? 0;
  const ganadas = (lista ?? []).filter(l => l.obtenida).length;

  return (
    <Screen scroll bg={colors.darkBg}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color="#fff">‹</AppText>
      </Pressable>
      <AppText variant="title" color="#fff">Logros</AppText>
      <AppText variant="body" color="rgba(255,255,255,0.6)" style={styles.sub}>{params.nombre}</AppText>

      {lista === null ? (
        <ActivityIndicator color={colors.gold} style={styles.loader} />
      ) : (
        <>
          {/* Progreso */}
          <View style={styles.resumen}>
            <View style={styles.resFila}>
              <Icon name="trophy" size={34} color={colors.gold} />
              <View style={styles.flex}>
                <AppText variant="title" color="#fff">{ganadas} de {total}</AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.75)">logros desbloqueados</AppText>
              </View>
            </View>
            <View style={styles.barra}><ProgressBar valor={total > 0 ? ganadas / total : 0} color={colors.gold} /></View>
          </View>

          {/* Lista de logros con leyenda */}
          {lista.map(l => (
            <View key={l.id} style={[styles.fila, l.obtenida ? styles.filaOn : styles.filaOff]}>
              <View style={[styles.medalla, l.obtenida ? styles.medOn : styles.medOff]}>
                <Icon name={l.obtenida ? iconoDeLogro(l.icono) : 'lock'} size={26} color={l.obtenida ? colors.gold : 'rgba(255,255,255,0.35)'} />
              </View>
              <View style={styles.flex}>
                <AppText variant="subtitle" color={l.obtenida ? '#fff' : 'rgba(255,255,255,0.7)'}>{l.nombre}</AppText>
                {l.descripcion ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.55)" style={styles.leyenda}>{l.descripcion}</AppText>
                ) : null}
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const M = 52;
const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl },
  flex: { flex: 1 },
  resumen: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg },
  resFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barra: { marginTop: spacing.md },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md,
    borderRadius: radii.lg, padding: spacing.md,
  },
  filaOn: { backgroundColor: 'rgba(215,165,60,0.12)', borderWidth: 1, borderColor: 'rgba(215,165,60,0.35)' },
  filaOff: { backgroundColor: 'rgba(255,255,255,0.04)' },
  medalla: { width: M, height: M, borderRadius: M / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  medOn: { backgroundColor: '#2A2418', borderColor: colors.gold },
  medOff: { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder },
  leyenda: { marginTop: 2, lineHeight: 17 },
});
