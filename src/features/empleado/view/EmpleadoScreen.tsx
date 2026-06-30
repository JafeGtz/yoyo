import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { QrScanner } from '../../../shared/ui/QrScanner';
import { colors, radii, spacing } from '../../../shared/theme';
import { cerrarSesion } from '../../../core/auth/authService';
import { useSession } from '../../../core/auth/SessionProvider';
import { canjearBeneficio, generarCodigoVisita, type ResultadoCanje } from '../../../data/services/canjeService';

const FONDO = '#15131F';
type Estado = 'escaneando' | 'procesando' | 'exito' | 'error';

export function EmpleadoScreen() {
  const { perfil } = useSession();
  const [estado, setEstado] = useState<Estado>('escaneando');
  const [resultado, setResultado] = useState<ResultadoCanje | null>(null);
  const [error, setError] = useState('');

  // Código de visita (modo "con código").
  const [codigoVisita, setCodigoVisita] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);

  async function generarCodigo() {
    if (!perfil?.negocio_id) return;
    setGenerando(true);
    setCodigoVisita(null);
    try {
      const r = await generarCodigoVisita(perfil.negocio_id);
      setCodigoVisita(r.codigo);
    } catch {
      setCodigoVisita('error');
    }
    setGenerando(false);
  }

  async function onScan(codigo: string) {
    setEstado('procesando');
    try {
      const r = await canjearBeneficio(codigo);
      setResultado(r);
      setEstado('exito');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al confirmar el canje.');
      setEstado('error');
    }
  }

  const reiniciar = () => {
    setResultado(null);
    setError('');
    setEstado('escaneando');
  };

  if (estado === 'exito' && resultado) {
    return (
      <Screen>
        <View style={styles.centroClaro}>
          <AppText variant="hero">✅</AppText>
          <AppText variant="title" style={styles.exitoTitulo}>Canje confirmado</AppText>
          <View style={styles.detalle}>
            <AppText variant="subtitle">{resultado.beneficio}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>Cliente: {resultado.cliente}</AppText>
          </View>
          <AppButton titulo="Escanear otro" onPress={reiniciar} style={styles.botonClaro} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fondo}>
      {estado === 'escaneando' && (
        <QrScanner activo onScan={onScan} instruccion="Escanea el código del cliente" colorMarco={colors.mint} />
      )}
      {estado === 'procesando' && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <AppText color="#fff" style={styles.overlayTexto}>Validando…</AppText>
        </View>
      )}
      {estado === 'error' && (
        <View style={styles.overlay}>
          <AppText variant="hero">😕</AppText>
          <AppText color="#fff" style={styles.overlayTexto}>{error}</AppText>
          <AppButton titulo="Reintentar" onPress={reiniciar} style={styles.botonOscuro} />
        </View>
      )}

      {/* Header flotante con título + cerrar sesión */}
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerFila}>
          <AppText variant="subtitle" color="#fff">Confirmar canje</AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)" onPress={cerrarSesion}>Salir</AppText>
        </View>
      </SafeAreaView>

      {/* Botón flotante: generar código de visita */}
      {estado === 'escaneando' && (
        <View style={styles.fab} pointerEvents="box-none">
          <AppButton titulo={generando ? 'Generando…' : '🔢 Código de visita'} onPress={generarCodigo} cargando={generando} />
        </View>
      )}

      {/* Modal con el código de visita generado */}
      <Modal visible={codigoVisita != null} transparent animationType="fade" onRequestClose={() => setCodigoVisita(null)}>
        <View style={styles.backdrop}>
          <View style={styles.hoja}>
            <AppText variant="subtitle">Código de visita</AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.hojaSub}>
              Dáselo al cliente para que registre su visita (un solo uso, 5 min).
            </AppText>
            {codigoVisita === 'error' ? (
              <AppText color={colors.danger}>No se pudo generar. Intenta de nuevo.</AppText>
            ) : (
              <AppText variant="hero" color={colors.primary} style={styles.codigoGrande}>{codigoVisita}</AppText>
            )}
            <AppButton titulo="Cerrar" variante="secundario" onPress={() => setCodigoVisita(null)} style={styles.botonClaro} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: FONDO },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: FONDO },
  overlayTexto: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  botonOscuro: { alignSelf: 'stretch' },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  centroClaro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exitoTitulo: { marginTop: spacing.md },
  detalle: { alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignSelf: 'stretch' },
  botonClaro: { alignSelf: 'stretch', marginTop: spacing.xl },
  fab: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.xl },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hoja: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', alignSelf: 'stretch' },
  hojaSub: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  codigoGrande: { fontSize: 56, letterSpacing: 8, marginVertical: spacing.sm },
});
