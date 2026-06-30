import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card, SoftCard } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { AppButton } from '../../../shared/ui/AppButton';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { CodigoCanjeModal } from '../../misBeneficios/view/CodigoCanjeModal';
import { useDetalleNegocioViewModel } from '../viewmodel/useDetalleNegocioViewModel';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

export function DetalleNegocioScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'DetalleNegocio'>>();
  const navigation = useNavigation<NavigationProp<ConsumidorStackParams>>();
  const { perfil } = useSession();
  const { state } = useDetalleNegocioViewModel(params.negocioId, perfil?.cliente_id ?? '');
  const [usando, setUsando] = useState<{ id: string; nombre: string } | null>(null);

  if (state.status !== 'listo') {
    return (
      <Screen>
        <Volver onPress={() => navigation.goBack()} />
        {state.status === 'cargando'
          ? <ActivityIndicator color={colors.primary} style={styles.loader} />
          : <AppText color={colors.danger}>{state.mensaje}</AppText>}
      </Screen>
    );
  }

  const d = state.data;
  const inicial = d.negocio.nombre.charAt(0).toUpperCase();

  return (
    <Screen scroll>
      <Volver onPress={() => navigation.goBack()} />

      {/* Encabezado: logo/inicial + nombre + tipo */}
      <View style={styles.encabezado}>
        <View style={styles.logo}>
          <AppText variant="title" color="#fff">{inicial}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="title">{d.negocio.nombre}</AppText>
          <AppText variant="body" color={colors.textSecondary}>{d.negocio.tipo}</AppText>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.acciones}>
        {d.negocio.telefono && (
          <AppButton titulo="📞 Llamar" variante="secundario" style={styles.accion}
            onPress={() => Linking.openURL(`tel:${d.negocio.telefono}`)} />
        )}
        {(d.negocio.direccion || d.negocio.lat) && (
          <AppButton titulo="📍 Ver mapa" style={styles.accion}
            onPress={() => Linking.openURL(
              d.negocio.lat != null
                ? `https://maps.google.com/?q=${d.negocio.lat},${d.negocio.lng}`
                : `https://maps.google.com/?q=${encodeURIComponent(d.negocio.direccion ?? '')}`,
            )} />
        )}
      </View>

      {/* Progreso */}
      <HeroCard style={styles.hero}>
        <View style={styles.heroFila}>
          <View>
            <AppText variant="hero" color="#fff" style={styles.visitas}>{d.visitasTotales}</AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">visitas · Nivel {d.nivel}</AppText>
          </View>
        </View>
        {d.beneficios.length > 0 && (
          <View style={styles.heroProg}>
            <ProgressBar valor={0.6} />
            <AppText variant="caption" color="rgba(255,255,255,0.8)" style={styles.heroSub}>
              Tienes {d.beneficios.length} beneficio{d.beneficios.length === 1 ? '' : 's'} listo{d.beneficios.length === 1 ? '' : 's'}
            </AppText>
          </View>
        )}
      </HeroCard>

      {/* Gira y Gana */}
      {d.tieneRuleta && (
        <AppButton
          titulo="🎡 Gira y Gana"
          variante="secundario"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Ruleta', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        />
      )}

      {/* Agendar cita */}
      {d.negocio.citas_modo !== 'desactivado' && (
        <AppButton
          titulo="📅 Agendar cita"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Cita', {
            negocioId: d.negocio.id,
            nombre: d.negocio.nombre,
            modo: d.negocio.citas_modo as 'solicitud' | 'agenda',
          })}
        />
      )}

      {/* Beneficios disponibles */}
      {d.beneficios.length > 0 && (
        <>
          <SectionHeader titulo="Tus beneficios aquí" />
          {d.beneficios.map(b => (
            <SoftCard key={b.id} style={styles.item}>
              <View style={styles.flex}>
                <AppText variant="subtitle">{b.nombre}</AppText>
                {b.vence_en && (
                  <AppText variant="caption" color={colors.textSecondary}>
                    Vence {new Date(b.vence_en).toLocaleDateString('es-MX')}
                  </AppText>
                )}
              </View>
              <Pressable style={styles.usar} onPress={() => setUsando({ id: b.id, nombre: b.nombre })}>
                <AppText variant="caption" color="#fff" style={styles.bold}>Usar</AppText>
              </Pressable>
            </SoftCard>
          ))}
        </>
      )}

      {/* Info */}
      {d.negocio.direccion && (
        <Card style={styles.info}>
          <AppText variant="caption" color={colors.textSecondary}>Ubicación</AppText>
          <AppText variant="body">{d.negocio.direccion}</AppText>
        </Card>
      )}

      {/* Ranking del mes */}
      {d.ranking.length > 0 && (
        <>
          <SectionHeader titulo="Top del mes" />
          <SoftCard>
            {d.ranking.map((r, i) => {
              const yo = r.cliente_id === (perfil?.cliente_id ?? '');
              return (
                <View key={r.cliente_id} style={[styles.rankFila, i > 0 && styles.divisor]}>
                  <AppText variant="subtitle" color={yo ? colors.primary : colors.textSecondary} style={styles.rankPos}>
                    {i + 1}
                  </AppText>
                  <AppText variant="body" style={styles.flex} color={yo ? colors.primary : colors.textPrimary}>
                    {yo ? 'Tú' : r.nombre}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>{r.visitas} visitas</AppText>
                </View>
              );
            })}
          </SoftCard>
        </>
      )}

      {/* Catálogo */}
      {d.catalogo.length > 0 && (
        <>
          <SectionHeader titulo="Catálogo" />
          {d.catalogo.map(it => (
            <SoftCard key={it.id} style={styles.item}>
              <View style={styles.flex}>
                <AppText variant="subtitle">{it.nombre}</AppText>
                {it.descripcion && <AppText variant="caption" color={colors.textSecondary}>{it.descripcion}</AppText>}
              </View>
              {it.precio != null && <AppText variant="subtitle" color={colors.primary}>${it.precio}</AppText>}
            </SoftCard>
          ))}
        </>
      )}

      {/* Historial */}
      {d.visitas.length > 0 && (
        <>
          <SectionHeader titulo="Tu historial" />
          <SoftCard>
            {d.visitas.map((v, i) => (
              <View key={v.id} style={[styles.historialFila, i > 0 && styles.divisor]}>
                <AppText variant="body" color={colors.textSecondary}>
                  {new Date(v.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </AppText>
                {v.monto != null && <AppText variant="body">${v.monto}</AppText>}
              </View>
            ))}
          </SoftCard>
        </>
      )}

      <CodigoCanjeModal beneficioId={usando?.id ?? null} nombre={usando?.nombre ?? ''} onClose={() => setUsando(null)} />
    </Screen>
  );
}

function Volver({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.volver} hitSlop={12}>
      <AppText variant="title" color={colors.primary}>‹</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  volver: { marginBottom: spacing.sm },
  encabezado: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  flex: { flex: 1 },
  acciones: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  accion: { flex: 1 },
  hero: { marginTop: spacing.lg },
  heroFila: { flexDirection: 'row', justifyContent: 'space-between' },
  visitas: { fontSize: 34, lineHeight: 38 },
  heroProg: { marginTop: spacing.md },
  heroSub: { marginTop: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  usar: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 },
  bold: { fontWeight: '700' },
  info: { marginTop: spacing.lg },
  historialFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  divisor: { borderTopWidth: 1, borderTopColor: colors.border },
  rankFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rankPos: { width: 28 },
  ruletaBtn: { marginTop: spacing.md },
});

