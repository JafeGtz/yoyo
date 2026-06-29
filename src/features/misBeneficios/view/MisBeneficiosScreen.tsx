import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useMisBeneficiosViewModel } from '../viewmodel/useMisBeneficiosViewModel';
import { CodigoCanjeModal } from './CodigoCanjeModal';

const ESTADO: Record<string, { texto: string; color: string }> = {
  disponible: { texto: 'Disponible', color: colors.mint },
  canjeado: { texto: 'Canjeado', color: colors.textSecondary },
  vencido: { texto: 'Vencido', color: colors.danger },
  pausado: { texto: 'Pausado', color: colors.textSecondary },
  agotado_cupo: { texto: 'Agotado', color: colors.textSecondary },
};

export function MisBeneficiosScreen() {
  const { perfil } = useSession();
  const { state } = useMisBeneficiosViewModel(perfil?.cliente_id ?? '');
  const [usando, setUsando] = useState<{ id: string; nombre: string } | null>(null);

  const disponibles =
    state.status === 'listo' ? state.beneficios.filter(b => b.estado === 'disponible').length : 0;

  return (
    <Screen scroll>
      <AppText variant="title">Mis beneficios</AppText>
      {state.status === 'listo' && (
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          {disponibles} disponible{disponibles === 1 ? '' : 's'} para canjear
        </AppText>
      )}

      <View style={styles.lista}>
        {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}
        {state.status === 'listo' && state.beneficios.length === 0 && (
          <AppText color={colors.textSecondary}>
            Aún no tienes beneficios. ¡Escanea para empezar a ganar! 🎁
          </AppText>
        )}

        {state.status === 'listo' &&
          state.beneficios.map(b => {
            const est = ESTADO[b.estado] ?? { texto: b.estado, color: colors.textSecondary };
            return (
              <SoftCard key={b.id} style={styles.item}>
                <View style={styles.ticket}>
                  <AppText variant="subtitle" color="#fff">🎟️</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="subtitle">{b.beneficio?.nombre ?? '—'}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {b.negocio?.nombre ?? ''}
                    {b.vence_en ? ` · vence ${new Date(b.vence_en).toLocaleDateString('es-MX')}` : ''}
                  </AppText>
                </View>
                {b.estado === 'disponible' ? (
                  <Pressable
                    style={styles.usar}
                    onPress={() => setUsando({ id: b.id, nombre: b.beneficio?.nombre ?? 'Beneficio' })}
                  >
                    <AppText variant="caption" color="#fff" style={styles.estadoTexto}>Usar</AppText>
                  </Pressable>
                ) : (
                  <View style={[styles.estado, { backgroundColor: est.color }]}>
                    <AppText variant="caption" color="#fff" style={styles.estadoTexto}>{est.texto}</AppText>
                  </View>
                )}
              </SoftCard>
            );
          })}
      </View>

      <CodigoCanjeModal
        beneficioId={usando?.id ?? null}
        nombre={usando?.nombre ?? ''}
        onClose={() => setUsando(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  lista: { marginTop: spacing.lg },
  loader: { marginTop: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  ticket: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  flex: { flex: 1 },
  estado: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { fontWeight: '700' },
  usar: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 },
});
