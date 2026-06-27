import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { Card } from '../../../shared/ui/Card';
import { Screen } from '../../../shared/ui/Screen';
import { colors, spacing } from '../../../shared/theme';
import { useMisNegociosViewModel } from '../viewmodel/useMisNegociosViewModel';

// Cliente de demo; vendrá de la sesión autenticada (Épica Auth, AUTH-1).
const CLIENTE_DEMO = 'cliente-demo';

/**
 * View (MVVM): solo renderiza el estado del ViewModel. Sin lógica de
 * negocio ni llamadas a datos.
 */
export function MisNegociosScreen() {
  const { state } = useMisNegociosViewModel(CLIENTE_DEMO);

  return (
    <Screen>
      <AppText variant="title">Mis negocios</AppText>
      <View style={styles.spacer} />

      {state.status === 'cargando' && (
        <ActivityIndicator color={colors.primary} />
      )}

      {state.status === 'error' && (
        <AppText color={colors.danger}>{state.mensaje}</AppText>
      )}

      {state.status === 'listo' && (
        <FlatList
          data={state.negocios}
          keyExtractor={item => item.negocio.id}
          renderItem={({ item }) => (
            <Card>
              <AppText variant="subtitle">{item.negocio.nombre}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {item.negocio.tipo} · Nivel {item.nivelActual}
              </AppText>
              <View style={styles.row}>
                <AppText>{item.visitasTotales} visitas</AppText>
                {item.proximoBeneficio != null &&
                  item.visitasParaProximoBeneficio != null && (
                    <AppText color={colors.primary}>
                      Faltan {item.visitasParaProximoBeneficio} para{' '}
                      {item.proximoBeneficio}
                    </AppText>
                  )}
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
