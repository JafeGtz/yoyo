import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { colors, spacing } from '../../../shared/theme';
import { supabase } from '../../../data/supabase/supabaseClient';
import { CatalogoGrid, type CatalogoItem } from './CatalogoGrid';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

export function CatalogoScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Catalogo'>>();
  const navigation = useNavigation();
  const [items, setItems] = useState<CatalogoItem[] | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase.from('catalogo_item')
      .select('id, nombre, descripcion, precio, foto_url')
      .eq('negocio_id', params.negocioId).order('orden')
      .then(({ data }) => { if (vivo) setItems((data as CatalogoItem[]) ?? []); });
    return () => { vivo = false; };
  }, [params.negocioId]);

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Catálogo</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {items === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <AppText color={colors.textSecondary} style={styles.loader}>Este negocio aún no tiene catálogo.</AppText>
      ) : (
        <CatalogoGrid items={items} />
      )}
    </Screen>
  );
}

const styles = {
  sub: { marginTop: spacing.xs },
  loader: { marginTop: spacing.xl },
} as const;
