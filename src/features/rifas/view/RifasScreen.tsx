import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

interface RifaCliente {
  id: string;
  nombre: string;
  premio: string | null;
  estado: string;
  minVisitas: number;
  gano: boolean;
}

export function RifasScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Rifas'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const [lista, setLista] = useState<RifaCliente[] | null>(null);
  const [visitas, setVisitas] = useState(0);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    (async () => {
      const [{ data: rifas }, { data: cn }] = await Promise.all([
        supabase.from('rifa')
          .select('id, nombre, premio, criterio, estado, ganador_cliente_id, beneficio:beneficio_id(nombre)')
          .eq('negocio_id', params.negocioId).order('creado_en', { ascending: false }),
        supabase.from('cliente_negocio').select('visitas_totales').eq('negocio_id', params.negocioId).eq('cliente_id', cid).maybeSingle(),
      ]);
      if (!vivo) return;
      setVisitas((cn as { visitas_totales: number } | null)?.visitas_totales ?? 0);
      const rows = (rifas as unknown as { id: string; nombre: string; premio: string | null; criterio: { min_visitas?: number } | null; estado: string; ganador_cliente_id: string | null; beneficio: { nombre: string } | null }[] ?? [])
        .map(r => ({
          id: r.id, nombre: r.nombre,
          premio: r.beneficio?.nombre ?? r.premio,
          estado: r.estado,
          minVisitas: r.criterio?.min_visitas ?? 0,
          gano: r.ganador_cliente_id === cid,
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
      <AppText variant="title">Rifas</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {lista === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : lista.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.vacio}>Este negocio no tiene rifas por ahora.</AppText>
      ) : (
        lista.map(r => {
          const participa = visitas >= r.minVisitas;
          const faltan = r.minVisitas - visitas;
          return (
            <Card key={r.id} style={styles.card}>
              <View style={styles.fila}>
                <AppText variant="subtitle" style={styles.flex}>{r.nombre}</AppText>
                {r.estado === 'sorteada'
                  ? <Etiqueta texto={r.gano ? '¡Ganaste!' : 'Ya se sorteó'} color={r.gano ? colors.mint : colors.textSecondary} />
                  : <Etiqueta texto="Abierta" color={colors.primary} />}
              </View>
              {r.premio ? <AppText variant="caption" color={colors.primary}>{r.premio}</AppText> : null}
              {r.estado !== 'sorteada' && (
                <AppText variant="caption" color={participa ? colors.mint : colors.textSecondary} style={styles.estado}>
                  {participa ? 'Estás participando' : `Te faltan ${faltan} visita${faltan === 1 ? '' : 's'} para participar`}
                </AppText>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Etiqueta({ texto, color }: { texto: string; color: string }) {
  return <AppText variant="caption" color={color} style={styles.badge}>{texto}</AppText>;
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.xl },
  card: { marginBottom: spacing.md },
  fila: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  badge: { fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
  estado: { marginTop: spacing.sm },
});
