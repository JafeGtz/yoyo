import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSession } from '../../core/auth/SessionProvider';
import { cerrarSesion } from '../../core/auth/authService';
import { colors, spacing } from '../../shared/theme';
import { AppText } from '../../shared/ui/AppText';
import { AppButton } from '../../shared/ui/AppButton';
import { Screen } from '../../shared/ui/Screen';
import { AuthFlow } from '../../features/auth/view/AuthFlow';
import { ConsumidorStack } from './ConsumidorStack';
import { EmpleadoScreen } from '../../features/empleado/view/EmpleadoScreen';

/**
 * Enruta según la sesión y el rol (mi_perfil):
 *   sin sesión          → AuthFlow (login/registro)
 *   consumidor          → tabs del consumidor
 *   personal            → app de empleado (confirmar canjes)
 *   dueño/admin         → mensaje (usan la web) + salir
 */
export function RootNavigator() {
  const { session, perfil, cargando, recargarPerfil } = useSession();

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session) return <AuthFlow />;

  switch (perfil?.rol) {
    case 'consumidor':
      return <ConsumidorStack />;
    case 'personal':
      return <EmpleadoScreen />;
    case 'dueno':
    case 'admin':
      return (
        <Screen>
          <View style={styles.centro}>
            <AppText variant="subtitle">Cuenta de negocio</AppText>
            <AppText color={colors.textSecondary} style={styles.texto}>
              Administra tu negocio desde el panel web. Esta app es para clientes y personal.
            </AppText>
            <AppButton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} style={styles.boton} />
          </View>
        </Screen>
      );
    default:
      // Sesión activa pero sin rol (perfil no cargó). Salida de emergencia.
      return (
        <Screen>
          <View style={styles.centro}>
            <AppText variant="subtitle">Casi listo…</AppText>
            <AppText color={colors.textSecondary} style={styles.texto}>
              No pudimos cargar tu perfil. Reintenta o vuelve a iniciar sesión.
            </AppText>
            <AppButton titulo="Reintentar" onPress={recargarPerfil} style={styles.boton} />
            <AppButton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} style={styles.botonSec} />
          </View>
        </Screen>
      );
  }
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { textAlign: 'center', marginTop: 8 },
  boton: { alignSelf: 'stretch', marginTop: spacing.xl },
  botonSec: { alignSelf: 'stretch', marginTop: spacing.sm },
});
