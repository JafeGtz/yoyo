import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { Confetti } from '../../../shared/ui/Confetti';
import { Icon } from '../../../shared/ui/Icon';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';

interface Premio { id: string; titulo: string; cuerpo: string | null }

/** Pop-up con animación de cofre que se abre cuando el cliente ganó algo. */
export function PremioPopup() {
  const { perfil } = useSession();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [confeti, setConfeti] = useState(false);

  const cofreRot = useRef(new Animated.Value(0)).current;
  const cofreScale = useRef(new Animated.Value(1)).current;
  const cofreOp = useRef(new Animated.Value(1)).current;
  const premioScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from('notificacion')
        .select('id, titulo, cuerpo')
        .eq('cliente_id', cid).eq('tipo', 'premio').is('leida_en', null)
        .order('creada_en', { ascending: false });
      if (!vivo || !data || data.length === 0) return;
      setPremios(data as Premio[]);
      await supabase.from('notificacion').update({ leida_en: new Date().toISOString() })
        .in('id', data.map(d => d.id));
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id]);

  // Secuencia del cofre: tiembla → se abre → salta el premio + confeti.
  useEffect(() => {
    if (premios.length === 0) return;
    const shake = (dir: number) =>
      Animated.timing(cofreRot, { toValue: dir, duration: 70, useNativeDriver: true });
    Animated.sequence([
      Animated.delay(250),
      Animated.sequence([shake(1), shake(-1), shake(1), shake(-1), shake(0.6), shake(0)]),
      Animated.parallel([
        Animated.timing(cofreScale, { toValue: 1.5, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cofreOp, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setAbierto(true);
      setConfeti(true);
      Animated.spring(premioScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premios.length]);

  if (premios.length === 0) return null;

  const rotate = cofreRot.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setPremios([])}>
      <View style={styles.backdrop}>
        {confeti && <Confetti />}
        <View style={styles.hoja}>
          {!abierto ? (
            <Animated.View style={{ transform: [{ rotate }, { scale: cofreScale }], opacity: cofreOp }}>
              <Icon name="gift" size={96} color={colors.primary} />
            </Animated.View>
          ) : (
            <Animated.View style={{ alignItems: 'center', alignSelf: 'stretch', transform: [{ scale: premioScale }] }}>
              <Icon name="trophy" size={52} color={colors.mint} />
              <AppText variant="title" color={colors.primary}>¡Ganaste!</AppText>
              {premios.map(p => (
                <View key={p.id} style={styles.item}>
                  <AppText variant="subtitle">{p.titulo}</AppText>
                  {p.cuerpo ? <AppText variant="caption" color={colors.textSecondary} style={styles.center}>{p.cuerpo}</AppText> : null}
                </View>
              ))}
              <AppButton titulo="¡Genial!" onPress={() => setPremios([])} style={styles.boton} />
            </Animated.View>
          )}
          {!abierto && <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>Abriendo tu premio…</AppText>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hoja: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', alignSelf: 'stretch', minHeight: 220, justifyContent: 'center' },
  cofre: { fontSize: 90 },
  hint: { marginTop: spacing.lg },
  item: { alignItems: 'center', marginTop: spacing.md },
  center: { textAlign: 'center', marginTop: spacing.xs },
  boton: { alignSelf: 'stretch', marginTop: spacing.xl },
});
