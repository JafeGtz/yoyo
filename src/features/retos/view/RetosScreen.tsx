import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

interface RetoCliente {
  id: string;
  nombre: string;
  descripcion: string | null;
  meta: number;
  tipo: string;
  premio: string | null;
  progreso: number;
  estado: string;
}

function progresoTexto(tipo: string, progreso: number, meta: number) {
  const p = Math.min(progreso, meta);
  if (tipo === 'monto') return `$${p} / $${meta}`;
  if (tipo === 'racha') return `${p} / ${meta} días seguidos`;
  if (tipo === 'referidos') return `${p} / ${meta} amigos`;
  if (tipo === 'resena') return `${p} / ${meta} reseña${meta === 1 ? '' : 's'}`;
  if (tipo === 'producto') return `${p} / ${meta} veces`;
  return `${p} / ${meta} visitas`;
}

export function RetosScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Retos'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [lista, setLista] = useState<RetoCliente[] | null>(null);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    (async () => {
      const [{ data: retos }, { data: prog }] = await Promise.all([
        supabase.from('reto')
          .select('id, nombre, descripcion, meta, tipo, beneficio:beneficio_id(nombre)')
          .eq('negocio_id', params.negocioId).eq('activo', true),
        supabase.from('reto_progreso').select('reto_id, progreso, estado').eq('cliente_id', cid),
      ]);
      if (!vivo) return;
      const mapa = new Map((prog ?? []).map((p: { reto_id: string; progreso: number; estado: string }) => [p.reto_id, p]));
      const rows = (retos as unknown as { id: string; nombre: string; descripcion: string | null; meta: number; tipo: string; beneficio: { nombre: string } | null }[] ?? [])
        .map(r => ({
          id: r.id, nombre: r.nombre, descripcion: r.descripcion, meta: r.meta ?? 1, tipo: r.tipo ?? 'visitas',
          premio: r.beneficio?.nombre ?? null,
          progreso: mapa.get(r.id)?.progreso ?? 0,
          estado: mapa.get(r.id)?.estado ?? 'en_progreso',
        }));
      setLista(rows);
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id, params.negocioId]);

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Retos</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {lista === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : lista.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.vacio}>Este negocio no tiene retos activos.</AppText>
      ) : (
        lista.map(r => {
          const completado = r.estado === 'completado' || r.progreso >= r.meta;
          const valor = Math.min(r.progreso / Math.max(r.meta, 1), 1);
          return (
            <Card key={r.id} style={styles.card}>
              <View style={styles.fila}>
                <AppText variant="subtitle" style={styles.flex}>{r.nombre}</AppText>
                {completado && (
                  <AppText variant="caption" color={colors.mint} style={styles.badge}>Completado</AppText>
                )}
              </View>
              {r.descripcion ? <AppText variant="caption" color={colors.textSecondary}>{r.descripcion}</AppText> : null}
              <View style={styles.prog}>
                <ProgressBar valor={valor} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.progTexto}>
                  {progresoTexto(r.tipo, r.progreso, r.meta)}
                </AppText>
              </View>
              {r.premio ? (
                <AppText variant="caption" color={colors.primary}>Premio: {r.premio}</AppText>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.xl },
  card: { marginBottom: spacing.md },
  fila: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  badge: { fontWeight: '700' },
  prog: { marginVertical: spacing.sm },
  progTexto: { marginTop: spacing.xs },
});
