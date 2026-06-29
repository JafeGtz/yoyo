import React from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { AppButton } from '../../../shared/ui/AppButton';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { useReferidosViewModel } from '../viewmodel/useReferidosViewModel';

export function ReferidosScreen() {
  const navigation = useNavigation();
  const { perfil } = useSession();
  const { state } = useReferidosViewModel(perfil?.cliente_id ?? '');

  async function compartir(codigo: string) {
    await Share.share({
      message: `¡Únete a yoyo y ganemos premios juntos! Usa mi código: ${codigo} 🎁`,
    });
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Invita y gana</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
        Cuando tu amigo registra su primera visita, ¡ambos ganan!
      </AppText>

      {state.status === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {state.status === 'error' && <AppText color={colors.danger}>{state.mensaje}</AppText>}

      {state.status === 'listo' && (
        <>
          <HeroCard style={styles.hero}>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">Tu código</AppText>
            <AppText variant="hero" color="#fff" style={styles.codigo}>{state.datos.codigo}</AppText>
            <View style={styles.heroFila}>
              <AppText variant="caption" color="rgba(255,255,255,0.8)">
                {state.datos.completados} amigo{state.datos.completados === 1 ? '' : 's'} se {state.datos.completados === 1 ? 'unió' : 'unieron'}
              </AppText>
            </View>
          </HeroCard>

          <AppButton titulo="📤 Compartir código" onPress={() => compartir(state.datos.codigo)} style={styles.boton} />

          {state.datos.referidos.length > 0 && (
            <>
              <SectionHeader titulo="Tus invitados" />
              {state.datos.referidos.map((r, i) => (
                <SoftCard key={i} style={styles.item}>
                  <View style={styles.flex}>
                    <AppText variant="subtitle">{r.referido?.nombre ?? 'Invitado'}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {new Date(r.creado_en).toLocaleDateString('es-MX')}
                    </AppText>
                  </View>
                  <View style={[styles.estado, r.estado === 'completado' ? styles.completado : styles.pendiente]}>
                    <AppText variant="caption" color={r.estado === 'completado' ? '#fff' : colors.textSecondary} style={styles.bold}>
                      {r.estado === 'completado' ? '✓ Unido' : 'Pendiente'}
                    </AppText>
                  </View>
                </SoftCard>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl },
  hero: { marginTop: spacing.lg, alignItems: 'center' },
  codigo: { letterSpacing: 4, marginVertical: spacing.sm },
  heroFila: { flexDirection: 'row' },
  boton: { marginTop: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  flex: { flex: 1 },
  estado: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  completado: { backgroundColor: colors.mint },
  pendiente: { backgroundColor: colors.surface },
  bold: { fontWeight: '700' },
});
