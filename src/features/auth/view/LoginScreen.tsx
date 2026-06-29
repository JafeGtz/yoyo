import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppInput } from '../../../shared/ui/AppInput';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { useAuthViewModel } from '../viewmodel/useAuthViewModel';

export function LoginScreen({ irARegistro }: { irARegistro: () => void }) {
  const { cargando, error, login } = useAuthViewModel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen bg={colors.lavenderBg} scroll>
      <View style={styles.header}>
        <AppText variant="hero">Bienvenido{'\n'}de vuelta 👋</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          Tu lealtad, recompensada
        </AppText>
      </View>

      <AppInput label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      {error && <AppText color={colors.danger} style={styles.error}>{error}</AppText>}

      <AppButton titulo="Entrar" onPress={() => login(email, password)} cargando={cargando} style={styles.boton} />

      <View style={styles.footer}>
        <AppText color={colors.textSecondary}>¿No tienes cuenta?  </AppText>
        <AppText color={colors.primary} onPress={irARegistro} style={styles.link}>Regístrate</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.xl },
  sub: { marginTop: spacing.sm },
  input: { backgroundColor: '#fff' },
  error: { marginBottom: spacing.sm },
  boton: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { fontWeight: '700' },
});
