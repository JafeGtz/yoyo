import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useMisBeneficiosViewModel } from '../viewmodel/useMisBeneficiosViewModel';
import { CodigoCanjeModal } from './CodigoCanjeModal';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const ESTADO: Record<string, string> = {
  canjeado: 'Usado', vencido: 'Vencido', pausado: 'Pausado', agotado_cupo: 'Agotado',
};

function diasRestantes(vence: string | null): number | null {
  if (!vence) return null;
  return Math.ceil((new Date(vence).getTime() - Date.now()) / 86400000);
}

export function MisBeneficiosScreen() {
  const { perfil } = useSession();
  const navigation = useNavigation<NavigationProp<ConsumidorStackParams>>();
  const { state } = useMisBeneficiosViewModel(perfil?.cliente_id ?? '');
  const [usando, setUsando] = useState<{ id: string; nombre: string } | null>(null);

  const beneficios = state.status === 'listo' ? state.beneficios : [];
  const disponibles = beneficios.filter(b => b.estado === 'disponible');
  const otros = beneficios.filter(b => b.estado !== 'disponible');

  return (
    <Screen scroll>
      <AppText variant="title">Mis premios</AppText>

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}

      {state.status === 'listo' && (
        <>
          {/* Banner de premios listos */}
          <View style={styles.banner}>
            <Icon name="gift" size={40} color="#fff" />
            <View style={styles.flex}>
              <AppText variant="title" color="#fff">{disponibles.length}</AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.9)">
                premio{disponibles.length === 1 ? '' : 's'} listo{disponibles.length === 1 ? '' : 's'} para canjear
              </AppText>
            </View>
          </View>

          {beneficios.length === 0 && (
            <AppText color={colors.textSecondary} style={styles.vacio}>
              Aún no tienes premios. ¡Visita negocios y desbloquéalos!
            </AppText>
          )}

          {/* Tickets disponibles */}
          {disponibles.map(b => {
            const dias = diasRestantes(b.vence_en);
            const urgente = dias != null && dias <= 3;
            return (
              <View key={b.id} style={styles.ticket}>
                <View style={styles.tira}>
                  <Icon name="ticket" size={26} color="#fff" />
                </View>
                <View style={styles.ticketBody}>
                  <AppText variant="subtitle" numberOfLines={1}>{b.beneficio?.nombre ?? '—'}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>{b.negocio?.nombre ?? ''}</AppText>
                  {dias != null && (
                    <AppText variant="caption" color={urgente ? colors.danger : colors.textSecondary}>
                      {dias <= 0 ? 'vence hoy' : `vence en ${dias} día${dias === 1 ? '' : 's'}`}
                    </AppText>
                  )}
                  <Pressable style={styles.canjear} onPress={() => setUsando({ id: b.id, nombre: b.beneficio?.nombre ?? 'Beneficio' })}>
                    <AppText variant="caption" color="#fff" style={styles.bold}>Canjear ahora</AppText>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Historial */}
          {otros.length > 0 && (
            <>
              <AppText variant="subtitle" color={colors.textSecondary} style={styles.histTitulo}>Historial</AppText>
              {otros.map(b => (
                <View key={b.id} style={styles.histFila}>
                  <Icon name={b.estado === 'canjeado' ? 'check' : 'alert'} size={20} color={colors.textSecondary} />
                  <View style={styles.flex}>
                    <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>{b.beneficio?.nombre ?? '—'}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>{b.negocio?.nombre ?? ''} · {ESTADO[b.estado] ?? b.estado}</AppText>
                  </View>
                  {b.estado === 'canjeado' && (
                    <Pressable onPress={() => navigation.navigate('Resena', { negocioId: b.negocio_id, nombre: b.negocio?.nombre ?? 'el negocio' })}>
                      <AppText variant="caption" color={colors.primary} style={styles.bold}>Calificar</AppText>
                    </Pressable>
                  )}
                </View>
              ))}
            </>
          )}
        </>
      )}

      <CodigoCanjeModal beneficioId={usando?.id ?? null} nombre={usando?.nombre ?? ''} onClose={() => setUsando(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  vacio: { marginTop: spacing.xl },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.mint, borderRadius: radii.xl, padding: spacing.lg,
  },
  ticket: {
    flexDirection: 'row', marginBottom: spacing.md, borderRadius: radii.lg, overflow: 'hidden',
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    shadowColor: '#1B1B2F', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  tira: {
    width: 64, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderStyle: 'dashed', borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  tiraEmoji: { fontSize: 30 },
  ticketBody: { flex: 1, padding: spacing.md, gap: 2 },
  canjear: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 9, marginTop: spacing.sm },
  histTitulo: { marginTop: spacing.lg, marginBottom: spacing.sm },
  histFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, opacity: 0.85 },
  histEmoji: { fontSize: 22 },
});
