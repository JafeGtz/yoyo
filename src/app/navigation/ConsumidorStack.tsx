import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsumidorTabs } from './ConsumidorTabs';
import { DetalleNegocioScreen } from '../../features/detalleNegocio/view/DetalleNegocioScreen';
import { InsigniasScreen } from '../../features/insignias/view/InsigniasScreen';
import { NotificacionesScreen } from '../../features/notificaciones/view/NotificacionesScreen';
import { ReferidosScreen } from '../../features/referidos/view/ReferidosScreen';
import { EditarPerfilScreen } from '../../features/editarPerfil/view/EditarPerfilScreen';
import { RuletaScreen } from '../../features/ruleta/view/RuletaScreen';
import { RascaScreen } from '../../features/rasca/view/RascaScreen';
import { RetosScreen } from '../../features/retos/view/RetosScreen';
import { RifasScreen } from '../../features/rifas/view/RifasScreen';
import { RecompensasScreen } from '../../features/recompensas/view/RecompensasScreen';
import { PremioPopup } from '../../features/premios/view/PremioPopup';
import { ResenaScreen } from '../../features/resena/view/ResenaScreen';
import { CitaScreen } from '../../features/cita/view/CitaScreen';
import type { ConsumidorStackParams } from './types';

const Stack = createNativeStackNavigator<ConsumidorStackParams>();

export function ConsumidorStack() {
  return (
    <>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={ConsumidorTabs} />
      <Stack.Screen name="DetalleNegocio" component={DetalleNegocioScreen} />
      <Stack.Screen name="Insignias" component={InsigniasScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Referidos" component={ReferidosScreen} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
      <Stack.Screen name="Ruleta" component={RuletaScreen} />
      <Stack.Screen name="Rasca" component={RascaScreen} />
      <Stack.Screen name="Retos" component={RetosScreen} />
      <Stack.Screen name="Rifas" component={RifasScreen} />
      <Stack.Screen name="Recompensas" component={RecompensasScreen} />
      <Stack.Screen name="Resena" component={ResenaScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Cita" component={CitaScreen} />
    </Stack.Navigator>
    <PremioPopup />
    </>
  );
}
