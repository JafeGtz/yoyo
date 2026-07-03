import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';

interface Premio { id: string; titulo: string; cuerpo: string | null }

/** Muestra un pop-up cuando el cliente ganó algo (rifa/reto) y aún no lo ha visto. */
export function PremioPopup() {
  const { perfil } = useSession();
  const [premios, setPremios] = useState<Premio[]>([]);

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
      // Marcar como vistas para que no reaparezcan.
      await supabase.from('notificacion').update({ leida_en: new Date().toISOString() })
        .in('id', data.map(d => d.id));
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id]);

  if (premios.length === 0) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setPremios([])}>
      <View style={styles.backdrop}>
        <View style={styles.hoja}>
          <AppText variant="hero">🎉</AppText>
          <AppText variant="title" color={colors.primary}>¡Ganaste un premio!</AppText>
          {premios.map(p => (
            <View key={p.id} style={styles.item}>
              <AppText variant="subtitle">{p.titulo}</AppText>
              {p.cuerpo ? <AppText variant="caption" color={colors.textSecondary} style={styles.center}>{p.cuerpo}</AppText> : null}
            </View>
          ))}
          <AppButton titulo="¡Genial!" onPress={() => setPremios([])} style={styles.boton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hoja: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', alignSelf: 'stretch' },
  item: { alignItems: 'center', marginTop: spacing.md },
  center: { textAlign: 'center', marginTop: spacing.xs },
  boton: { alignSelf: 'stretch', marginTop: spacing.xl },
});
