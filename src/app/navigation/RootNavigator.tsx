import React from 'react';
import { MisNegociosScreen } from '../../features/misNegocios/view/MisNegociosScreen';

/**
 * Navegación raíz. Por ahora renderiza una sola pantalla de muestra.
 *
 * Próximo paso (Épica 0 / F0-4): integrar React Navigation
 *   npm install @react-navigation/native @react-navigation/native-stack \
 *               react-native-screens react-native-safe-area-context
 * y definir el árbol: Auth (login/registro) → Tabs del cliente
 * (Inicio, Escanear, Beneficios, Perfil).
 */
export function RootNavigator() {
  return <MisNegociosScreen />;
}
