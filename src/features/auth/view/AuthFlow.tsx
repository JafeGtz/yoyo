import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegistroScreen } from './RegistroScreen';

/** Alterna entre login y registro sin necesitar un stack de navegación. */
export function AuthFlow() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  return modo === 'login' ? (
    <LoginScreen irARegistro={() => setModo('registro')} />
  ) : (
    <RegistroScreen irALogin={() => setModo('login')} />
  );
}
