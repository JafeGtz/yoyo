import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { Badge } from '../../../shared/ui/Badge';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import { useMisNegociosViewModel } from '../viewmodel/useMisNegociosViewModel';

const TIERS: [number, string][] = [
  [5000, 'Diamante'], [1500, 'Platino'], [500, 'Oro'], [100, 'Plata'], [0, 'Bronce'],
];
function siguienteTier(puntos: number) {
  const orden = [...TIERS].reverse(); // bronce -> diamante
  for (const [min, nombre] of orden) {
    if (puntos < min) return { faltan: min - puntos, nombre };
  }
  return null; // ya es diamante
}

export function MisNegociosScreen() {
  const { perfil } = useSession();
  const { state } = useMisNegociosViewModel(perfil?.cliente_id ?? '');
  const [puntos, setPuntos] = useState(0);
  const [nivel, setNivel] = useState('Bronce');

  useEffect(() => {
    if (!perfil?.cliente_id) return;
    supabase
      .from('cliente')
      .select('puntos_globales, nivel_embajador')
      .eq('id', perfil.cliente_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPuntos(data.puntos_globales);
          setNivel(capitalizar(data.nivel_embajador));
        }
      });
  }, [perfil?.cliente_id]);

  const sig = siguienteTier(puntos);

  return (
    <Screen scroll>
      <AppText variant="caption" color={colors.textSecondary}>Hola,</AppText>
      <AppText variant="title">{perfil?.nombre ?? 'Cliente'} 👋</AppText>

      <HeroCard style={styles.hero}>
        <View style={styles.heroFila}>
          <View>
            <AppText variant="hero" color="#fff" style={styles.puntos}>{puntos.toLocaleString('es-MX')}</AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">puntos globales</AppText>
          </View>
          <Badge label={`Embajador ${nivel}`} />
        </View>
        <View style={styles.heroProgreso}>
          <ProgressBar valor={sig ? 1 - sig.faltan / (sig.faltan + puntos || 1) : 1} />
          <AppText variant="caption" color="rgba(255,255,255,0.8)" style={styles.heroSub}>
            {sig ? `${sig.faltan} pts para ${sig.nombre}` : '¡Nivel máximo alcanzado!'}
          </AppText>
        </View>
      </HeroCard>

      <SectionHeader titulo="Mis negocios" />

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}
      {state.status === 'listo' && state.negocios.length === 0 && (
        <AppText color={colors.textSecondary}>
          Aún no tienes negocios. ¡Escanea un QR para empezar a ganar!
        </AppText>
      )}

      {state.status === 'listo' &&
        state.negocios.map(n => {
          const umbral = n.visitasTotales + (n.visitasParaProximoBeneficio ?? 0);
          const prog = umbral > 0 ? n.visitasTotales / umbral : 1;
          return (
            <Card key={n.negocio.id} style={styles.negocio}>
              <View style={styles.negocioFila}>
                <View style={styles.flex}>
                  <AppText variant="subtitle">{n.negocio.nombre}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {n.negocio.tipo} · Nivel {n.nivelActual}
                  </AppText>
                </View>
                <View style={styles.visitasPill}>
                  <AppText variant="subtitle" color={colors.primary}>{n.visitasTotales}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>visitas</AppText>
                </View>
              </View>
              <View style={styles.barra}>
                <ProgressBar valor={prog} color={colors.primary} trackColor={colors.surface} />
              </View>
              <AppText variant="caption" color={n.proximoBeneficio ? colors.primary : colors.textSecondary}>
                {n.proximoBeneficio
                  ? `Faltan ${n.visitasParaProximoBeneficio} para ${n.proximoBeneficio}`
                  : 'Sin beneficios próximos'}
              </AppText>
            </Card>
          );
        })}
    </Screen>
  );
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  hero: { marginTop: spacing.md },
  heroFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  puntos: { fontSize: 34, lineHeight: 38 },
  heroProgreso: { marginTop: spacing.md },
  heroSub: { marginTop: spacing.sm },
  loader: { marginTop: spacing.lg },
  negocio: { marginBottom: spacing.md },
  negocioFila: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  visitasPill: { alignItems: 'center' },
  barra: { marginVertical: spacing.sm },
});
