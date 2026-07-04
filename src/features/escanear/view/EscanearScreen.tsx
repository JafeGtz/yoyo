import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { QrScanner } from '../../../shared/ui/QrScanner';
import { colors, radii, spacing } from '../../../shared/theme';
import {
  registrarVisita, ApiError, catalogoDelNegocio, marcarProductoVisita,
  type ResultadoVisita, type ProductoOpcion,
} from '../../../data/services/canjeService';

const FONDO = '#15131F';
type Estado = 'escaneando' | 'procesando' | 'pide_codigo' | 'exito' | 'error';

export function EscanearScreen() {
  const enfocada = useIsFocused();
  const [estado, setEstado] = useState<Estado>('escaneando');
  const [token, setToken] = useState('');
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<ResultadoVisita | null>(null);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [productoElegido, setProductoElegido] = useState<string | null>(null);

  // Al registrar la visita, carga el catálogo para poder etiquetar el producto.
  useEffect(() => {
    if (estado !== 'exito' || !resultado?.negocio_id) return;
    let vivo = true;
    catalogoDelNegocio(resultado.negocio_id).then(p => { if (vivo) setProductos(p); });
    return () => { vivo = false; };
  }, [estado, resultado?.negocio_id]);

  async function etiquetar(item: ProductoOpcion) {
    if (!resultado?.visita_id) return;
    setProductoElegido(item.nombre);
    try { await marcarProductoVisita(resultado.visita_id, item.id); } catch { /* opcional, no bloquea */ }
  }

  async function intentar(qrToken: string, cod?: string) {
    setEstado('procesando');
    try {
      const r = await registrarVisita(qrToken, undefined, cod);
      setResultado(r);
      setEstado('exito');
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'falta_codigo_visita') {
        setEstado('pide_codigo');
        return;
      }
      if (e instanceof ApiError && e.codigo === 'codigo_invalido') {
        setError('Código incorrecto o ya usado.');
        setEstado('pide_codigo');
        return;
      }
      setError(e instanceof Error ? e.message : 'Error al registrar la visita.');
      setEstado('error');
    }
  }

  function onScan(qrToken: string) {
    setToken(qrToken);
    intentar(qrToken);
  }

  function reiniciar() {
    setResultado(null);
    setError('');
    setCodigo('');
    setToken('');
    setProductos([]);
    setProductoElegido(null);
    setEstado('escaneando');
  }

  if (estado === 'exito' && resultado) {
    return (
      <Screen>
        <View style={styles.centroClaro}>
          <AppText variant="hero">🎉</AppText>
          <AppText variant="title" style={styles.exitoTitulo}>¡Visita registrada!</AppText>
          <AppText variant="subtitle" color={colors.primary}>Visita #{resultado.visita_numero}</AppText>
          {resultado.beneficios_desbloqueados.length > 0 && (
            <View style={styles.beneficios}>
              <AppText variant="caption" color={colors.textSecondary}>Desbloqueaste:</AppText>
              {resultado.beneficios_desbloqueados.map(b => (
                <AppText key={b.id} variant="subtitle" color={colors.mint} style={styles.beneficio}>🎁 {b.nombre}</AppText>
              ))}
            </View>
          )}

          {/* Etiquetar producto (opcional) — avanza retos de producto */}
          {productos.length > 0 && (
            productoElegido ? (
              <AppText variant="caption" color={colors.mint} style={styles.overlayTexto}>✓ Anotamos: {productoElegido}</AppText>
            ) : (
              <View style={styles.etiquetar}>
                <AppText variant="caption" color={colors.textSecondary}>¿Qué te llevaste? (opcional)</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {productos.map(p => (
                    <Pressable key={p.id} onPress={() => etiquetar(p)} style={styles.chip}>
                      <AppText variant="caption" color={colors.textPrimary}>{p.nombre}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )
          )}

          <AppButton titulo="Listo" onPress={reiniciar} style={styles.botonClaro} />
        </View>
      </Screen>
    );
  }

  // Pedir código de 4 dígitos (negocio en modo "con código").
  if (estado === 'pide_codigo') {
    return (
      <Screen bg={FONDO}>
        <View style={styles.centroOscuro}>
          <AppText variant="title" color="#fff">Código de visita</AppText>
          <AppText color="rgba(255,255,255,0.7)" style={styles.overlayTexto}>
            Pídele el código al personal y tecléalo.
          </AppText>
          <TextInput
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.codigoInput}
            autoFocus
          />
          {error ? <AppText color={colors.danger} style={styles.overlayTexto}>{error}</AppText> : null}
          <AppButton titulo="Confirmar" onPress={() => intentar(token, codigo)} deshabilitado={codigo.length < 4} style={styles.botonClaro} />
          <AppButton titulo="Cancelar" variante="secundario" onPress={reiniciar} style={styles.botonSec} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fondo}>
      {estado === 'escaneando' && (
        <QrScanner activo={enfocada} onScan={onScan} instruccion="Apunta al QR del negocio" />
      )}
      {estado === 'procesando' && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <AppText color="#fff" style={styles.overlayTexto}>Registrando tu visita…</AppText>
        </View>
      )}
      {estado === 'error' && (
        <View style={styles.overlay}>
          <AppText variant="hero">😕</AppText>
          <AppText color="#fff" style={styles.overlayTexto}>{error}</AppText>
          <AppButton titulo="Reintentar" onPress={reiniciar} style={styles.botonOscuro} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: FONDO },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: FONDO },
  centroOscuro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayTexto: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  codigoInput: {
    width: 180, height: 70, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 36, textAlign: 'center', letterSpacing: 12, marginVertical: spacing.md,
  },
  botonOscuro: { alignSelf: 'stretch', backgroundColor: colors.primary },
  botonClaro: { alignSelf: 'stretch', marginTop: spacing.lg },
  botonSec: { alignSelf: 'stretch', marginTop: spacing.sm },
  centroClaro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exitoTitulo: { marginTop: spacing.md },
  beneficios: { alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignSelf: 'stretch' },
  beneficio: { marginTop: spacing.xs },
  etiquetar: { alignSelf: 'stretch', marginTop: spacing.lg },
  chips: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface },
});
