import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { SoftCard } from '../../../shared/ui/Card';
import { HeroCard } from '../../../shared/ui/HeroCard';
import { Badge } from '../../../shared/ui/Badge';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { cerrarSesion } from '../../../core/auth/authService';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PerfilScreen() {
  const { perfil } = useSession();
  const navigation = useNavigation<NavigationProp<ConsumidorStackParams>>();
  const [puntos, setPuntos] = useState<number | null>(null);
  const [nivel, setNivel] = useState('Bronce');
  const [insignias, setInsignias] = useState(0);

  useEffect(() => {
    if (!perfil?.cliente_id) return;
    (async () => {
      const { data } = await supabase
        .from('cliente')
        .select('puntos_globales, nivel_embajador')
        .eq('id', perfil.cliente_id)
        .single();
      if (data) {
        setPuntos(data.puntos_globales);
        setNivel(capitalizar(data.nivel_embajador));
      }
      const { count } = await supabase
        .from('insignia_obtenida')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', perfil.cliente_id);
      setInsignias(count ?? 0);
    })();
  }, [perfil?.cliente_id]);

  const accesos: { icono: string; label: string; valor?: string; destino?: keyof ConsumidorStackParams }[] = [
    { icono: '🏅', label: 'Insignias', valor: String(insignias), destino: 'Insignias' },
    { icono: '🏪', label: 'Mis negocios' },
    { icono: '🔔', label: 'Notificaciones', destino: 'Notificaciones' },
    { icono: '👥', label: 'Referidos' },
  ];

  return (
    <Screen scroll>
      <AppText variant="title">Mi perfil</AppText>

      <HeroCard style={styles.hero}>
        <View style={styles.heroFila}>
          <View style={styles.flex}>
            <AppText variant="subtitle" color="#fff">{perfil?.nombre ?? 'Cliente'}</AppText>
            <View style={styles.badge}><Badge label={`Embajador ${nivel}`} /></View>
            <AppText variant="hero" color="#fff" style={styles.puntos}>
              {(puntos ?? 0).toLocaleString('es-MX')} <AppText variant="body" color="rgba(255,255,255,0.8)">puntos</AppText>
            </AppText>
          </View>
          <View style={styles.avatar}>
            <AppText variant="title" color="#fff">{(perfil?.nombre ?? 'C').charAt(0).toUpperCase()}</AppText>
          </View>
        </View>
      </HeroCard>

      <View style={styles.grid}>
        {accesos.map(a => (
          <Pressable
            key={a.label}
            style={styles.gridWrap}
            onPress={() => a.destino && navigation.navigate(a.destino as never)}
          >
            <SoftCard style={styles.gridItem}>
              <View style={styles.iconoCirculo}>
                <AppText variant="subtitle">{a.icono}</AppText>
              </View>
              <AppText variant="caption" style={styles.gridLabel}>{a.label}</AppText>
              {a.valor && <AppText variant="subtitle" color={colors.primary}>{a.valor}</AppText>}
            </SoftCard>
          </Pressable>
        ))}
      </View>

      <AppText variant="subtitle" style={styles.seccion}>Cuenta</AppText>
      <SoftCard style={styles.grupo}>
        <Fila icono="👤" label="Datos personales" />
        <Divisor />
        <Fila icono="🔒" label="Privacidad" />
      </SoftCard>

      <AppText variant="subtitle" style={styles.seccion}>Soporte</AppText>
      <SoftCard style={styles.grupo}>
        <Fila icono="❓" label="Centro de ayuda" />
        <Divisor />
        <Fila icono="💬" label="Contáctanos" />
      </SoftCard>

      <View style={styles.logout}>
        <AppButton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
      </View>
    </Screen>
  );
}

function Fila({ icono, label }: { icono: string; label: string }) {
  return (
    <View style={styles.fila}>
      <AppText variant="body" style={styles.filaIcono}>{icono}</AppText>
      <AppText variant="body" style={styles.flex}>{label}</AppText>
      <AppText variant="body" color={colors.textSecondary}>›</AppText>
    </View>
  );
}

const Divisor = () => <View style={styles.divisor} />;

const styles = StyleSheet.create({
  hero: { marginTop: spacing.md },
  heroFila: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  badge: { marginVertical: spacing.sm },
  puntos: { fontSize: 30, lineHeight: 34 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  gridWrap: { width: '47%' },
  gridItem: { alignItems: 'center', paddingVertical: spacing.lg },
  iconoCirculo: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.lavender,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  gridLabel: { fontWeight: '700' },
  seccion: { marginTop: spacing.xl, marginBottom: spacing.sm },
  grupo: { paddingVertical: spacing.xs },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  filaIcono: { marginRight: spacing.md },
  divisor: { height: 1, backgroundColor: colors.border, marginLeft: 36 },
  logout: { marginTop: spacing.xl },
});
