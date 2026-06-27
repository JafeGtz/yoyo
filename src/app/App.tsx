import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';

/**
 * Raíz de la aplicación. Aquí se montarán los providers globales
 * (tema, sesión de auth, cliente de datos, etc.) conforme se agreguen.
 */
export function App() {
  const isDark = useColorScheme() === 'dark';
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

export default App;
