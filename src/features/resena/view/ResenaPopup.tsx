import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { Icon } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';

/** Popup rápido para calificar tras registrar una visita. La reseña se guarda
 *  privada; el dueño decide si la muestra públicamente. Es opcional/saltable. */
export function ResenaPopup({ negocioId, visible, onClose }: {
  negocioId: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { perfil } = useSession();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Reinicia el estado cada vez que se abre.
  useEffect(() => {
    if (visible) { setEstrellas(0); setComentario(''); setEnviado(false); setEnviando(false); }
  }, [visible]);

  async function enviar() {
    if (estrellas === 0 || !perfil?.cliente_id || !negocioId) return;
    setEnviando(true);
    await supabase.from('resena').insert({
      cliente_id: perfil.cliente_id,
      negocio_id: negocioId,
      estrellas,
      comentario: comentario.trim() || null,
    });
    setEnviando(false);
    setEnviado(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.hoja}>
          {enviado ? (
            <View style={styles.gracias}>
              <Icon name="check2" size={44} color={colors.mint} />
              <AppText variant="subtitle" style={styles.graciasTxt}>¡Gracias por tu opinión!</AppText>
              <AppButton titulo="Listo" onPress={onClose} style={styles.boton} />
            </View>
          ) : (
            <>
              <AppText variant="subtitle">¿Cómo estuvo tu visita?</AppText>
              <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>Tu opinión ayuda a otros clientes.</AppText>

              <View style={styles.estrellas}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable key={n} onPress={() => setEstrellas(n)} hitSlop={6}>
                    <Icon name="star" size={38} color={n <= estrellas ? colors.mint : colors.border} />
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={comentario}
                onChangeText={setComentario}
                placeholder="Comentario (opcional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                style={styles.comentario}
              />

              <AppButton
                titulo={enviando ? 'Enviando…' : 'Enviar'}
                onPress={enviar}
                cargando={enviando}
                deshabilitado={estrellas === 0}
                style={styles.boton}
              />
              <Pressable onPress={onClose} hitSlop={8} style={styles.ahora}>
                <AppText variant="caption" color={colors.textSecondary}>Ahora no</AppText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hoja: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.xl, alignSelf: 'stretch' },
  sub: { marginTop: spacing.xs },
  estrellas: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  comentario: {
    minHeight: 70, borderRadius: radii.md, backgroundColor: colors.surface,
    padding: spacing.md, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top',
  },
  boton: { marginTop: spacing.lg },
  ahora: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.xs },
  gracias: { alignItems: 'center', gap: spacing.sm },
  graciasTxt: { marginTop: spacing.xs },
});
