import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppInput } from '../../../shared/ui/AppInput';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { useAuthViewModel } from '../viewmodel/useAuthViewModel';

export function RegistroScreen({ irALogin }: { irALogin: () => void }) {
  const { cargando, error, registrar } = useAuthViewModel();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen bg={colors.lavenderBg} scroll>
      <View style={styles.header}>
        <AppText variant="hero">Crea tu{'\n'}cuenta 🎁</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          Empieza a ganar recompensas
        </AppText>
      </View>

      <AppInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
      <AppInput label="Celular (opcional)" value={celular} onChangeText={setCelular} keyboardType="phone-pad" style={styles.input} />
      <AppInput label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      {error && <AppText color={colors.danger} style={styles.error}>{error}</AppText>}

      <AppButton titulo="Crear cuenta" onPress={() => registrar({ email, password, nombre, celular })} cargando={cargando} style={styles.boton} />

      <View style={styles.footer}>
        <AppText color={colors.textSecondary}>¿Ya tienes cuenta?  </AppText>
        <AppText color={colors.primary} onPress={irALogin} style={styles.link}>Inicia sesión</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
  sub: { marginTop: spacing.sm },
  input: { backgroundColor: '#fff' },
  error: { marginBottom: spacing.sm },
  boton: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { fontWeight: '700' },
});
