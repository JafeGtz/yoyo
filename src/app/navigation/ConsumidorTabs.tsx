import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MisNegociosScreen } from '../../features/misNegocios/view/MisNegociosScreen';
import { EscanearScreen } from '../../features/escanear/view/EscanearScreen';
import { MisBeneficiosScreen } from '../../features/misBeneficios/view/MisBeneficiosScreen';
import { DescubrirScreen } from '../../features/descubrir/view/DescubrirScreen';
import { PerfilScreen } from '../../features/perfil/view/PerfilScreen';
import { TabBar } from './TabBar';

const Tab = createBottomTabNavigator();

export function ConsumidorTabs() {
  return (
    <Tab.Navigator
      tabBar={TabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={MisNegociosScreen} />
      <Tab.Screen name="Beneficios" component={MisBeneficiosScreen} />
      <Tab.Screen name="Escanear" component={EscanearScreen} />
      <Tab.Screen name="Descubrir" component={DescubrirScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
