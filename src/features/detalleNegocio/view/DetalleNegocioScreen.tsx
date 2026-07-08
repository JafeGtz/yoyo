import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card, SoftCard } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { AppButton } from '../../../shared/ui/AppButton';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { MedidorVisitas } from '../../../shared/ui/MedidorVisitas';
import { Icon } from '../../../shared/ui/Icon';
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

      {/* Ubicación */}
      {d.negocio.direccion && (
        <View style={styles.direccionRow}>
          <Icon name="map" size={16} color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>{d.negocio.direccion}</AppText>
        </View>
      )}

      {/* Acciones como mosaicos */}
      <View style={styles.acciones}>
        {d.negocio.telefono && (
          <Pressable style={styles.accionTile} onPress={() => Linking.openURL(`tel:${d.negocio.telefono}`)}>
            <View style={[styles.accionIcon, { backgroundColor: colors.mintSoft }]}><Icon name="phone" size={20} color="#159A78" /></View>
            <AppText variant="caption" style={styles.accionLabel}>Llamar</AppText>
          </Pressable>
        )}
        {(d.negocio.direccion || d.negocio.lat) && (
          <Pressable
            style={styles.accionTile}
            onPress={() => Linking.openURL(
              d.negocio.lat != null
                ? `https://maps.google.com/?q=${d.negocio.lat},${d.negocio.lng}`
                : `https://maps.google.com/?q=${encodeURIComponent(d.negocio.direccion ?? '')}`,
            )}
          >
            <View style={[styles.accionIcon, { backgroundColor: colors.lavender }]}><Icon name="map" size={20} color={colors.primary} /></View>
            <AppText variant="caption" style={styles.accionLabel}>Cómo llegar</AppText>
          </Pressable>
        )}
        {d.negocio.telefono && (
          <Pressable
            style={styles.accionTile}
            onPress={() => Linking.openURL(`https://wa.me/${d.negocio.telefono!.replace(/\D/g, '')}`)}
          >
            <View style={[styles.accionIcon, { backgroundColor: '#DCF8E8' }]}><Icon name="chat" size={20} color="#1EA362" /></View>
            <AppText variant="caption" style={styles.accionLabel}>WhatsApp</AppText>
          </Pressable>
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
        {/* Medidor de visitas (clickeable → línea de tiempo de recompensas) */}
        <Pressable
          style={styles.medidor}
          onPress={() => navigation.navigate('Recompensas', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        >
          {d.hitos.length > 0 && (
            <>
              <MedidorVisitas visitas={d.visitasTotales} hitos={d.hitos} sobreOscuro />
              <AppText variant="caption" color={colors.mint} style={styles.faltan}>
                {d.faltanProximo != null
                  ? `Faltan ${d.faltanProximo} visita${d.faltanProximo === 1 ? '' : 's'} para ${d.proximoNombre}`
                  : "¡Ya desbloqueaste todos los de visitas!"}
              </AppText>
            </>
          )}
          <AppText variant="caption" color="#fff" style={styles.verTodas}>Ver todas las recompensas ›</AppText>
        </Pressable>
      </HeroCard>

      {/* Compartir carné de fan */}
      <AppButton
        icono="camera"
        titulo="Compartir mi carné de fan"
        variante="secundario"
        style={styles.ruletaBtn}
        onPress={() => navigation.navigate('CarneFan', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
      />

      {/* Gira y Gana */}
      {d.tieneRuleta && (
        <AppButton
          icono="wheel"
          titulo="Gira y Gana"
          variante="secundario"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Ruleta', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        />
      )}

      {/* Rasca y Gana */}
      {d.tieneRasca && (
        <AppButton
          icono="coin"
          titulo="Rasca y Gana"
          variante="secundario"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Rasca', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        />
      )}

      {/* Retos */}
      {d.tieneRetos && (
        <AppButton
          icono="target"
          titulo="Retos"
          variante="secundario"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Retos', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        />
      )}

      {/* Rifas */}
      {d.tieneRifas && (
        <AppButton
          icono="gift"
          titulo="Rifas"
          variante="secundario"
          style={styles.ruletaBtn}
          onPress={() => navigation.navigate('Rifas', { negocioId: d.negocio.id, nombre: d.negocio.nombre })}
        />
      )}

      {/* Agendar cita */}
      {d.negocio.citas_modo !== 'desactivado' && (
        <AppButton
          icono="calendar"
          titulo="Agendar cita"
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
          <SectionHeader titulo="Top del mes" onVerTodo={() => navigation.navigate('Ranking', { negocioId: d.negocio.id, nombre: d.negocio.nombre })} />
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

      {/* Catálogo en cuadrícula con fotos */}
      {d.catalogo.length > 0 && (
        <>
          <SectionHeader titulo="Catálogo" />
          <View style={styles.grid}>
            {d.catalogo.map(it => (
              <View key={it.id} style={styles.gridItem}>
                <View style={styles.gridFoto}>
                  {it.foto_url
                    ? <Image source={{ uri: it.foto_url }} style={styles.fotoImg} resizeMode="cover" />
                    : <Icon name="bag" size={34} color={colors.textSecondary} />}
                </View>
                <AppText variant="caption" numberOfLines={1} style={styles.gridNombre}>{it.nombre}</AppText>
                {it.precio != null && <AppText variant="subtitle" color={colors.primary}>${it.precio}</AppText>}
              </View>
            ))}
          </View>
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
  direccionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  direccionPin: { fontSize: 16 },
  acciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  accionTile: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg,
    paddingVertical: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  accionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  accionEmoji: { fontSize: 20 },
  accionLabel: { fontWeight: '700' },
  hero: { marginTop: spacing.lg },
  heroFila: { flexDirection: 'row', justifyContent: 'space-between' },
  visitas: { fontSize: 34, lineHeight: 38 },
  heroProg: { marginTop: spacing.md },
  heroSub: { marginTop: spacing.sm },
  medidor: { marginTop: spacing.lg },
  faltan: { marginTop: spacing.md, fontWeight: '700' },
  verTodas: { marginTop: spacing.sm, fontWeight: '700', textDecorationLine: 'underline' },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.sm, alignItems: 'center',
  },
  gridFoto: {
    width: '100%', height: 100, borderRadius: radii.md, backgroundColor: colors.lavender,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.sm,
  },
  fotoImg: { width: '100%', height: '100%' },
  gridNombre: { textAlign: 'center', marginBottom: 2 },
  usar: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 },
  bold: { fontWeight: '700' },
  info: { marginTop: spacing.lg },
  historialFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  divisor: { borderTopWidth: 1, borderTopColor: colors.border },
  rankFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rankPos: { width: 28 },
  ruletaBtn: { marginTop: spacing.md },
});

