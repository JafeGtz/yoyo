import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { supabase } from '../../../data/supabase/supabaseClient';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

interface Datos {
  negocio: string;
  logo: string | null;
  portada: string | null;
  visitas: number;
  nivel: string;
  insignias: number;
  ahorro: number;
  clienteDelMes: boolean;
}

export function CarneFanScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'CarneFan'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const cardRef = useRef<View>(null);
  const [d, setD] = useState<Datos | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  useEffect(() => {
    const cid = perfil?.cliente_id;
    if (!cid) return;
    let vivo = true;
    (async () => {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [{ data: neg }, { data: cn }, { count: insCount }, { data: canjes }, { data: rank }] = await Promise.all([
        supabase.from('negocio').select('nombre, logo_url, portada_url').eq('id', params.negocioId).single(),
        supabase.from('cliente_negocio').select('visitas_totales, nivel:nivel_membresia_id(nombre)').eq('negocio_id', params.negocioId).eq('cliente_id', cid).maybeSingle(),
        supabase.from('insignia_obtenida').select('id', { count: 'exact', head: true }).eq('cliente_id', cid),
        supabase.from('canje').select('costo').eq('negocio_id', params.negocioId).eq('cliente_id', cid),
        supabase.rpc('ranking_negocio', { p_negocio_id: params.negocioId, p_desde: inicioMes }),
      ]);
      if (!vivo) return;
      const ahorro = ((canjes as { costo: number | null }[]) ?? []).reduce((s, c) => s + Number(c.costo ?? 0), 0);
      const top = (rank as { cliente_id: string }[]) ?? [];
      setD({
        negocio: (neg as { nombre: string })?.nombre ?? params.nombre,
        logo: (neg as { logo_url: string | null })?.logo_url ?? null,
        portada: (neg as { portada_url: string | null })?.portada_url ?? null,
        visitas: (cn as { visitas_totales: number } | null)?.visitas_totales ?? 0,
        nivel: (cn as unknown as { nivel: { nombre: string } | null } | null)?.nivel?.nombre ?? 'Fan',
        insignias: insCount ?? 0,
        ahorro,
        clienteDelMes: top.length > 0 && top[0].cliente_id === cid,
      });
    })();
    return () => { vivo = false; };
  }, [perfil?.cliente_id, params.negocioId]);

  async function compartir() {
    if (!cardRef.current) return;
    setCompartiendo(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.98, result: 'data-uri' });
      await Share.open({ url: uri, message: `¡Soy fan de ${d?.negocio} en yoyo! 🎉`, failOnCancel: false });
    } catch { /* cancelado */ }
    setCompartiendo(false);
  }

  if (!d) {
    return (
      <Screen>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><AppText variant="title" color={colors.primary}>‹</AppText></Pressable>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}><AppText variant="title" color={colors.primary}>‹</AppText></Pressable>
      <AppText variant="title">Tu carné</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>Compártelo en tus stories 📸</AppText>

      {/* CARD compartible */}
      <View ref={cardRef} collapsable={false} style={styles.card}>
        {d.portada ? <Image source={{ uri: d.portada }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={styles.overlay} />

        <View style={styles.contenido}>
          <View style={styles.top}>
            <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.bold}>yoyo</AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.bold}>
              {d.clienteDelMes ? 'CLIENTE DEL MES' : 'CARNÉ DE FAN'}
            </AppText>
          </View>

          <View style={styles.centro}>
            <View style={styles.logo}>
              {d.logo ? <Image source={{ uri: d.logo }} style={styles.logoImg} /> : <AppText variant="hero">{d.negocio.charAt(0).toUpperCase()}</AppText>}
            </View>
            <AppText variant="title" color="#fff" style={styles.negNombre}>{d.negocio}</AppText>
            <View style={styles.badge}>
              <AppText variant="subtitle" color="#fff">
                {d.clienteDelMes ? '👑 Cliente del mes' : `⭐ Fan · Nivel ${d.nivel}`}
              </AppText>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat n={`${d.visitas}`} l="visitas" />
            <Stat n={`$${d.ahorro.toLocaleString('es-MX')}`} l="ahorrados" />
            <Stat n={`${d.insignias}`} l="insignias" />
          </View>

          <View style={styles.footer}>
            <AppText variant="subtitle" color="#fff">— {perfil?.nombre ?? 'Cliente'}</AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.75)">hazte fan en yoyo</AppText>
          </View>
        </View>
      </View>

      <AppButton titulo={compartiendo ? 'Preparando…' : '📤 Compartir'} onPress={compartir} cargando={compartiendo} style={styles.boton} />
    </Screen>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title" color="#fff" style={styles.statN}>{n}</AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.8)">{l}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginTop: spacing.xl },
  bold: { fontWeight: '800', letterSpacing: 1 },
  card: {
    alignSelf: 'center', width: '100%', aspectRatio: 0.72, borderRadius: radii.xl, overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(40,28,90,0.62)' },
  contenido: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  centro: { alignItems: 'center', gap: spacing.md },
  logo: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 88, height: 88 },
  negNombre: { textAlign: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statN: { fontSize: 26 },
  footer: { alignItems: 'center', gap: 2 },
  boton: { marginTop: spacing.xl },
});
