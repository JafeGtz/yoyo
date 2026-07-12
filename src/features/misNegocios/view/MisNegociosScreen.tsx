import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useIsFocused, type NavigationProp } from '@react-navigation/native';
import { supabase } from '../../../data/supabase/supabaseClient';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { MedidorVisitas } from '../../../shared/ui/MedidorVisitas';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { Icon } from '../../../shared/ui/Icon';
import { NivelBadge } from '../../../shared/ui/NivelBadge';
import { iconoDeLogro } from '../../../shared/ui/insigniaIcono';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useMisNegociosViewModel } from '../viewmodel/useMisNegociosViewModel';
import { useDescubrirViewModel, type NegocioDir } from '../../descubrir/viewmodel/useDescubrirViewModel';
import { useInsigniasViewModel } from '../../insignias/viewmodel/useInsigniasViewModel';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

// Paleta de acentos que combinan con el morado (menta, rosa, dorado, turquesa, coral).
const ACENTOS = [
  { fuerte: '#4F3CE0', suave: '#ECE9FC' },
  { fuerte: '#34D6A8', suave: '#DAF6EE' },
];

export function MisNegociosScreen() {
  const { perfil } = useSession();
  const navigation = useNavigation<NavigationProp<ConsumidorStackParams>>();
  const { state } = useMisNegociosViewModel(perfil?.cliente_id ?? '');
  const descubrir = useDescubrirViewModel();
  const insig = useInsigniasViewModel(perfil?.cliente_id ?? '');
  const medallas = insig.state.status === 'listo'
    ? [...insig.state.insignias].sort((a, b) => Number(b.obtenida) - Number(a.obtenida)).slice(0, 6)
    : [];
  const medTotal = insig.state.status === 'listo' ? insig.state.total : 0;
  const medDe = insig.state.status === 'listo' ? insig.state.insignias.length : 0;

  // Notificaciones sin leer (se refresca al volver al home).
  const enfocada = useIsFocused();
  const [noLeidas, setNoLeidas] = useState(0);
  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid || !enfocada) return;
    supabase.from('notificacion').select('id', { count: 'exact', head: true })
      .eq('cliente_id', cid).is('leida_en', null)
      .then(({ count }) => setNoLeidas(count ?? 0));
  }, [perfil?.cliente_id, enfocada]);

  const verDetalle = (id: string, nombre: string) =>
    navigation.navigate('DetalleNegocio', { negocioId: id, nombre });

  const sinNegocios = state.status === 'listo' && state.negocios.length === 0;

  return (
    <Screen scroll>
      <View style={styles.homeHeader}>
        {perfil?.foto_url ? <Image source={{ uri: perfil.foto_url }} style={styles.avatarHome} /> : null}
        <View style={styles.flex}>
          <AppText variant="caption" color={colors.textSecondary}>Hola,</AppText>
          <AppText variant="title">{perfil?.nombre ?? 'Cliente'}</AppText>
        </View>
        <Pressable style={styles.campana} onPress={() => navigation.navigate('Notificaciones')} hitSlop={8}>
          <Icon name="bell" size={24} color={colors.primary} />
          {noLeidas > 0 && (
            <View style={styles.campanaBadge}>
              <AppText variant="caption" color="#fff" style={styles.campanaNum}>{noLeidas > 9 ? '9+' : noLeidas}</AppText>
            </View>
          )}
        </Pressable>
      </View>

      {/* Preview del medallero → toca para ver todo */}
      {medallas.length > 0 && (
        <Pressable style={styles.medallero} onPress={() => navigation.navigate('Insignias')}>
          <View style={styles.medFila}>
            <View style={styles.medTit}>
              <Icon name="trophy" size={18} color={colors.mint} />
              <AppText variant="subtitle">Medallero</AppText>
            </View>
            <AppText variant="caption" color={colors.primary} style={styles.bold}>{medTotal}/{medDe} · Ver todo ›</AppText>
          </View>
          <View style={styles.medRow}>
            {medallas.map(m => (
              <View key={m.id} style={[styles.mini, m.obtenida ? styles.miniOn : styles.miniOff]}>
                <Icon name={m.obtenida ? iconoDeLogro(m.icono) : 'lock'} size={20} color={m.obtenida ? colors.mint : colors.textSecondary} />
              </View>
            ))}
          </View>
        </Pressable>
      )}

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}

      {/* CON negocios: lista con progreso */}
      {state.status === 'listo' && state.negocios.length > 0 && (
        <>
          <SectionHeader titulo="Mis negocios" />
          {state.negocios.map((n, i) => {
            const ac = ACENTOS[i % ACENTOS.length];
            return (
              <Pressable key={n.negocio.id} onPress={() => verDetalle(n.negocio.id, n.negocio.nombre)}>
                <Card style={[styles.negocio, { borderLeftWidth: 4, borderLeftColor: ac.fuerte }]}>
                  <View style={styles.negocioFila}>
                    <View style={[styles.avatar, { backgroundColor: ac.fuerte }]}>
                      {n.negocio.logoUrl
                        ? <Image source={{ uri: n.negocio.logoUrl }} style={styles.avatarImg} />
                        : <AppText variant="subtitle" color="#fff">{n.negocio.nombre.charAt(0).toUpperCase()}</AppText>}
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="subtitle">{n.negocio.nombre}</AppText>
                      <AppText variant="caption" color={colors.textSecondary} style={styles.tipo}>{n.negocio.tipo}</AppText>
                      <NivelBadge nivel={n.nivelActual} fuerte={ac.fuerte} suave={ac.suave} />
                    </View>
                    <View style={[styles.visitasPill, { backgroundColor: ac.suave }]}>
                      <AppText variant="subtitle" color={ac.fuerte}>{n.visitasTotales}</AppText>
                      <AppText variant="caption" color={colors.textSecondary}>visitas</AppText>
                    </View>
                  </View>
                  <View style={styles.barra}>
                    <MedidorVisitas visitas={n.visitasTotales} hitos={n.hitos ?? []} />
                  </View>
                  <AppText variant="caption" color={n.proximoBeneficio ? colors.primary : colors.textSecondary}>
                    {n.proximoBeneficio
                      ? `Faltan ${n.visitasParaProximoBeneficio} para ${n.proximoBeneficio}`
                      : '¡Todo desbloqueado aquí!'}
                  </AppText>
                </Card>
              </Pressable>
            );
          })}
        </>
      )}

      {/* SIN negocios: carrusel de descubrimiento */}
      {sinNegocios && (
        <View>
          <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
            Aún no has visitado ningún negocio. ¡Descubre lugares y empieza a ganar!
          </AppText>
          <SectionHeader titulo="Negocios para visitar" onVerTodo={() => navigation.navigate('Descubrir' as never)} />

          {descubrir.state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          {descubrir.state.status === 'listo' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
              {descubrir.state.negocios.map((n: NegocioDir, i: number) => (
                <Pressable key={n.id} onPress={() => verDetalle(n.id, n.nombre)} style={styles.tarjeta}>
                  {n.portada_url ? (
                    <Image source={{ uri: n.portada_url }} style={styles.portada} />
                  ) : (
                    <View style={[styles.portada, styles.portadaVacia, { backgroundColor: ACENTOS[i % ACENTOS.length].fuerte }]}>
                      <AppText variant="hero" color="#fff">{n.nombre.charAt(0).toUpperCase()}</AppText>
                    </View>
                  )}
                  <View style={styles.tarjetaInfo}>
                    <AppText variant="subtitle" numberOfLines={1}>{n.nombre}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>{n.tipo}</AppText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.lg },
  bold: { fontWeight: '700' },
  homeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarHome: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface },
  campana: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lavender,
    alignItems: 'center', justifyContent: 'center',
  },
  campanaBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: colors.background,
  },
  campanaNum: { fontWeight: '800', fontSize: 10 },
  medallero: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.lg },
  medFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  medTit: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  medRow: { flexDirection: 'row', gap: spacing.sm },
  mini: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  miniOn: { backgroundColor: '#DAF6EE', borderColor: colors.mint },
  miniOff: { backgroundColor: colors.white, borderColor: colors.border, opacity: 0.7 },
  miniEmoji: { fontSize: 20 },
  negocio: { marginBottom: spacing.md },
  negocioFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  tipo: { marginBottom: 6 },
  flex: { flex: 1 },
  visitasPill: { alignItems: 'center', borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  barra: { marginVertical: spacing.sm },
  regla: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  intro: { marginTop: spacing.md },
  carrusel: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.lg },
  tarjeta: { width: 240, borderRadius: radii.xl, backgroundColor: colors.white, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  portada: { width: 240, height: 140, backgroundColor: colors.surface },
  portadaVacia: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tarjetaInfo: { padding: spacing.md },
});
