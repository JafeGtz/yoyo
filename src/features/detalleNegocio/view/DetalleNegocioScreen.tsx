import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card, SoftCard } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { MedidorVisitas } from '../../../shared/ui/MedidorVisitas';
import { WalletStack } from '../../../shared/ui/WalletStack';
import { CatalogoGrid } from '../../catalogo/view/CatalogoGrid';
import { Icon, type IconName } from '../../../shared/ui/Icon';
import { acentos, colors, radii, spacing } from '../../../shared/theme';
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
  const acLogo = acentos[[...d.negocio.nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % acentos.length];

  return (
    <Screen scroll>
      <Volver onPress={() => navigation.goBack()} />

      {/* Encabezado: logo/inicial + nombre + tipo */}
      <View style={styles.encabezado}>
        <View style={[styles.logo, { backgroundColor: acLogo.fuerte }]}>
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

      {/* Acciones (carné, juegos, cita) como mosaicos colorados */}
      <View style={styles.accionesGrid}>
        {([
          { on: true, icono: 'star', label: 'Mi carné VIP', go: () => navigation.navigate('CarneFan', { negocioId: d.negocio.id, nombre: d.negocio.nombre }) },
          { on: d.tieneRuleta, icono: 'wheel', label: 'Gira y Gana', go: () => navigation.navigate('Ruleta', { negocioId: d.negocio.id, nombre: d.negocio.nombre }) },
          { on: d.tieneRasca, icono: 'coin', label: 'Rasca y Gana', go: () => navigation.navigate('Rasca', { negocioId: d.negocio.id, nombre: d.negocio.nombre }) },
          { on: d.tieneRetos, icono: 'target', label: 'Retos', go: () => navigation.navigate('Retos', { negocioId: d.negocio.id, nombre: d.negocio.nombre }) },
          { on: d.tieneRifas, icono: 'gift', label: 'Rifas', go: () => navigation.navigate('Rifas', { negocioId: d.negocio.id, nombre: d.negocio.nombre }) },
          { on: d.negocio.citas_modo !== 'desactivado', icono: 'calendar', label: 'Agendar cita', go: () => navigation.navigate('Cita', { negocioId: d.negocio.id, nombre: d.negocio.nombre, modo: d.negocio.citas_modo as 'solicitud' | 'agenda' }) },
        ] as { on: boolean; icono: IconName; label: string; go: () => void }[])
          .filter(a => a.on)
          .map((a, idx) => {
            const c = acentos[idx % acentos.length];
            return (
              <Pressable key={a.label} style={[styles.tile, { backgroundColor: c.suave }]} onPress={a.go}>
                <View style={[styles.tileIcon, { backgroundColor: c.fuerte }]}>
                  <Icon name={a.icono} size={24} color="#fff" />
                </View>
                <AppText variant="subtitle" color={c.fuerte}>{a.label}</AppText>
              </Pressable>
            );
          })}
      </View>

      {/* Beneficios disponibles — carrusel tipo billetera */}
      {d.beneficios.length > 0 && (
        <>
          <SectionHeader titulo={`Tus beneficios aquí · ${d.beneficios.length}`} />
          <WalletStack items={d.beneficios.map(b => ({ id: b.id, titulo: b.nombre, vence_en: b.vence_en }))} onUsar={setUsando} />
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

      {/* Catálogo (solo 4 + ver todo -> pantalla completa) */}
      {d.catalogo.length > 0 && (
        <>
          <SectionHeader
            titulo="Catálogo"
            onVerTodo={d.catalogo.length > 4
              ? () => navigation.navigate('Catalogo', { negocioId: d.negocio.id, nombre: d.negocio.nombre })
              : undefined}
          />
          <CatalogoGrid items={d.catalogo.slice(0, 4)} />
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
  accionesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.md },
  tile: { width: '48%', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm, alignItems: 'flex-start' },
  tileIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
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

