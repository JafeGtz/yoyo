import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { Icon } from '../../../shared/ui/Icon';
import { colors, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';

interface Resena { id: string; estrellas: number; comentario: string | null; creada_en: string }

function Estrellas({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <View style={styles.estrellas}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="star" size={size} color={i <= n ? colors.mint : colors.border} />
      ))}
    </View>
  );
}

/** "Lo que dicen los clientes": reseñas que el dueño aprobó como públicas. */
export function ResenasNegocio({ negocioId }: { negocioId: string }) {
  const [resenas, setResenas] = useState<Resena[] | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase.from('resena')
      .select('id, estrellas, comentario, creada_en')
      .eq('negocio_id', negocioId).eq('aprobada_por_dueno', true)
      .order('creada_en', { ascending: false }).limit(10)
      .then(({ data }) => { if (vivo) setResenas((data as Resena[]) ?? []); });
    return () => { vivo = false; };
  }, [negocioId]);

  if (!resenas || resenas.length === 0) return null;

  const promedio = resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length;
  const conComentario = resenas.filter(r => r.comentario && r.comentario.trim()).slice(0, 5);

  return (
    <>
      <SectionHeader titulo="Lo que dicen los clientes" />
      <View style={styles.resumen}>
        <AppText variant="hero" color={colors.primary} style={styles.prom}>{promedio.toFixed(1)}</AppText>
        <View>
          <Estrellas n={Math.round(promedio)} size={16} />
          <AppText variant="caption" color={colors.textSecondary}>{resenas.length} reseña{resenas.length === 1 ? '' : 's'}</AppText>
        </View>
      </View>

      {conComentario.map(r => (
        <SoftCard key={r.id} style={styles.card}>
          <Estrellas n={r.estrellas} />
          <AppText variant="body" style={styles.comentario}>{r.comentario}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {new Date(r.creada_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </AppText>
        </SoftCard>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  estrellas: { flexDirection: 'row', gap: 2 },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prom: { fontSize: 40, lineHeight: 46 },
  card: { marginTop: spacing.sm },
  comentario: { marginTop: spacing.xs, marginBottom: spacing.xs },
});
