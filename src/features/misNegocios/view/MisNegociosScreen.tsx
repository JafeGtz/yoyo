import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { MedidorVisitas } from '../../../shared/ui/MedidorVisitas';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useMisNegociosViewModel } from '../viewmodel/useMisNegociosViewModel';
import { useDescubrirViewModel, type NegocioDir } from '../../descubrir/viewmodel/useDescubrirViewModel';
import { useInsigniasViewModel } from '../../insignias/viewmodel/useInsigniasViewModel';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const ICONOS: Record<string, string> = {
  sparkle: '✨', medal: '🥇', trophy: '🏆', sunrise: '🌅', moon: '🌙',
  users: '👥', cake: '🎂', compass: '🧭', flame: '🔥', crown: '👑',
};
const emoji = (icono: string | null) => (icono && ICONOS[icono]) || '🏅';

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

  const verDetalle = (id: string, nombre: string) =>
    navigation.navigate('DetalleNegocio', { negocioId: id, nombre });

  const sinNegocios = state.status === 'listo' && state.negocios.length === 0;

  return (
    <Screen scroll>
      <AppText variant="caption" color={colors.textSecondary}>Hola,</AppText>
      <AppText variant="title">{perfil?.nombre ?? 'Cliente'} 👋</AppText>

      {/* Preview del medallero → toca para ver todo */}
      {medallas.length > 0 && (
        <Pressable style={styles.medallero} onPress={() => navigation.navigate('Insignias')}>
          <View style={styles.medFila}>
            <AppText variant="subtitle">🏆 Medallero</AppText>
            <AppText variant="caption" color={colors.primary} style={styles.bold}>{medTotal}/{medDe} · Ver todo ›</AppText>
          </View>
          <View style={styles.medRow}>
            {medallas.map(m => (
              <View key={m.id} style={[styles.mini, m.obtenida ? styles.miniOn : styles.miniOff]}>
                <AppText style={styles.miniEmoji}>{m.obtenida ? emoji(m.icono) : '🔒'}</AppText>
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
          {state.negocios.map(n => {
            return (
              <Pressable key={n.negocio.id} onPress={() => verDetalle(n.negocio.id, n.negocio.nombre)}>
                <Card style={styles.negocio}>
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
                    <MedidorVisitas visitas={n.visitasTotales} hitos={n.hitos ?? []} />
                  </View>
                  <AppText variant="caption" color={n.proximoBeneficio ? colors.primary : colors.textSecondary}>
                    {n.proximoBeneficio
                      ? `Faltan ${n.visitasParaProximoBeneficio} para ${n.proximoBeneficio}`
                      : '¡Todo desbloqueado aquí! 🎉'}
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
            Aún no has visitado ningún negocio. ¡Descubre lugares y empieza a ganar! 🎁
          </AppText>
          <SectionHeader titulo="Negocios para visitar" onVerTodo={() => navigation.navigate('Descubrir' as never)} />

          {descubrir.state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          {descubrir.state.status === 'listo' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
              {descubrir.state.negocios.map((n: NegocioDir) => (
                <Pressable key={n.id} onPress={() => verDetalle(n.id, n.nombre)} style={styles.tarjeta}>
                  {n.portada_url ? (
                    <Image source={{ uri: n.portada_url }} style={styles.portada} />
                  ) : (
                    <View style={[styles.portada, styles.portadaVacia]}>
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
  medallero: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.lg },
  medFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  medRow: { flexDirection: 'row', gap: spacing.sm },
  mini: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  miniOn: { backgroundColor: '#FFF6E0', borderColor: colors.gold },
  miniOff: { backgroundColor: colors.white, borderColor: colors.border, opacity: 0.7 },
  miniEmoji: { fontSize: 20 },
  negocio: { marginBottom: spacing.md },
  negocioFila: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  visitasPill: { alignItems: 'center' },
  barra: { marginVertical: spacing.sm },
  regla: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  intro: { marginTop: spacing.md },
  carrusel: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.lg },
  tarjeta: { width: 240, borderRadius: radii.xl, backgroundColor: colors.white, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  portada: { width: 240, height: 140, backgroundColor: colors.surface },
  portadaVacia: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tarjetaInfo: { padding: spacing.md },
});
