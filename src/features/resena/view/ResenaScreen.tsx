import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { Icon } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

export function ResenaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Resena'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();

  const [estrellas, setEstrellas] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar() {
    if (estrellas === 0) {
      setError('Elige una calificación.');
      return;
    }
    setEnviando(true);
    setError('');
    const { error: insertError } = await supabase.from('resena').insert({
      cliente_id: perfil?.cliente_id,
      negocio_id: params.negocioId,
      estrellas,
      nps,
      comentario: comentario || null,
    });
    setEnviando(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    navigation.goBack();
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">¿Cómo fue tu experiencia?</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {/* Estrellas */}
      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable key={n} onPress={() => setEstrellas(n)} hitSlop={6}>
            <Icon name="star" size={40} color={n <= estrellas ? colors.star : colors.border} />
          </Pressable>
        ))}
      </View>

      {/* NPS */}
      <AppText variant="subtitle" style={styles.seccion}>¿Qué tan probable es que lo recomiendes?</AppText>
      <View style={styles.nps}>
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <Pressable key={n} onPress={() => setNps(n)} style={[styles.npsPill, nps === n && styles.npsPillOn]}>
            <AppText variant="caption" color={nps === n ? '#fff' : colors.textSecondary} style={styles.bold}>{n}</AppText>
          </Pressable>
        ))}
      </View>

      {/* Comentario */}
      <AppText variant="subtitle" style={styles.seccion}>Comentario (opcional)</AppText>
      <TextInput
        value={comentario}
        onChangeText={setComentario}
        placeholder="Cuéntanos más…"
        placeholderTextColor={colors.textSecondary}
        multiline
        style={styles.comentario}
      />

      {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}
      <AppButton titulo="Enviar reseña" onPress={enviar} cargando={enviando} style={styles.boton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  estrellas: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
  estrella: { fontSize: 44 },
  seccion: { marginTop: spacing.xl, marginBottom: spacing.sm },
  nps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  npsPill: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  npsPillOn: { backgroundColor: colors.primary },
  bold: { fontWeight: '700' },
  comentario: {
    minHeight: 100, borderRadius: radii.md, backgroundColor: colors.surface,
    padding: spacing.md, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top',
  },
  error: { marginTop: spacing.md },
  boton: { marginTop: spacing.xl },
});
