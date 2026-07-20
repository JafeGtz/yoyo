import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { Icon } from '../../../shared/ui/Icon';
import { WalletStack } from '../../../shared/ui/WalletStack';
import { programarAvisosVencimiento, probarAvisoVencimiento } from '../../../core/notificaciones/avisosVencimiento';
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
  // Vigente = disponible y sin vencer (filtro en el cliente, sin costo extra).
  const vigente = (b: (typeof beneficios)[number]) => !b.vence_en || new Date(b.vence_en).getTime() >= Date.now();
  const disponibles = beneficios.filter(b => b.estado === 'disponible' && vigente(b));
  const otros = beneficios.filter(b => !(b.estado === 'disponible' && vigente(b)));

  // Programa avisos locales de vencimiento cuando cargan los beneficios.
  useEffect(() => {
    if (state.status !== 'listo') return;
    programarAvisosVencimiento(
      state.beneficios.map(b => ({
        id: b.id,
        estado: b.estado,
        vence_en: b.vence_en,
        nombre: b.beneficio?.nombre ?? 'Tu premio',
        negocio: b.negocio?.nombre ?? 'el negocio',
      })),
    );
  }, [state]);

  return (
    <Screen scroll>
      <View style={styles.tituloFila}>
        <AppText variant="title" style={styles.flex}>Mis premios</AppText>
        <Pressable
          style={styles.probar}
          hitSlop={8}
          onPress={() => {
            // Feedback inmediato: si NO ves este alert, el bundle JS no recargó (rebuild).
            Alert.alert('Probando…', 'Programando el aviso de prueba.');
            probarAvisoVencimiento().then(r => {
              Alert.alert(
                r.ok ? 'Aviso programado' : 'No se pudo',
                r.ok ? 'Llegará en ~30 segundos. Puedes cerrar la app para verlo.' : (r.error ?? 'Error desconocido'),
              );
            });
          }}
        >
          <Icon name="bell" size={16} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={styles.bold}>Probar aviso</AppText>
        </Pressable>
      </View>

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

          {/* Tickets disponibles — pila estilo billetera */}
          {disponibles.length > 0 && (
            <WalletStack
              items={disponibles.map(b => ({
                id: b.id,
                titulo: b.beneficio?.nombre ?? 'Beneficio',
                subtitulo: b.negocio?.nombre ?? undefined,
                vence_en: b.vence_en,
              }))}
              onUsar={setUsando}
              textoUsar="Canjear ahora"
            />
          )}

          {/* Historial */}
          {otros.length > 0 && (
            <>
              <AppText variant="subtitle" color={colors.textSecondary} style={styles.histTitulo}>Historial</AppText>
              {otros.map(b => (
                <View key={b.id} style={styles.histFila}>
                  <Icon name={b.estado === 'canjeado' ? 'check' : 'alert'} size={20} color={colors.textSecondary} />
                  <View style={styles.flex}>
                    <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>{b.beneficio?.nombre ?? '—'}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>{b.negocio?.nombre ?? ''} · {b.estado === 'disponible' && !vigente(b) ? 'Vencido' : (ESTADO[b.estado] ?? b.estado)}</AppText>
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
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  probar: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lavender, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
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
