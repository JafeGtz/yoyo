import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsumidorTabs } from './ConsumidorTabs';
import { DetalleNegocioScreen } from '../../features/detalleNegocio/view/DetalleNegocioScreen';
import { InsigniasScreen } from '../../features/insignias/view/InsigniasScreen';
import { NotificacionesScreen } from '../../features/notificaciones/view/NotificacionesScreen';
import { ReferidosScreen } from '../../features/referidos/view/ReferidosScreen';
import { ResenaScreen } from '../../features/resena/view/ResenaScreen';
import type { ConsumidorStackParams } from './types';

const Stack = createNativeStackNavigator<ConsumidorStackParams>();

export function ConsumidorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={ConsumidorTabs} />
      <Stack.Screen name="DetalleNegocio" component={DetalleNegocioScreen} />
      <Stack.Screen name="Insignias" component={InsigniasScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Referidos" component={ReferidosScreen} />
      <Stack.Screen name="Resena" component={ResenaScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
