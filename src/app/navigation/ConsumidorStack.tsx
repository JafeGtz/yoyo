import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsumidorTabs } from './ConsumidorTabs';
import { DetalleNegocioScreen } from '../../features/detalleNegocio/view/DetalleNegocioScreen';
import type { ConsumidorStackParams } from './types';

const Stack = createNativeStackNavigator<ConsumidorStackParams>();

export function ConsumidorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={ConsumidorTabs} />
      <Stack.Screen name="DetalleNegocio" component={DetalleNegocioScreen} />
    </Stack.Navigator>
  );
}
