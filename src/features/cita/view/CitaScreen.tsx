import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, radii, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { agendarCita, slotsDisponibles, solicitarCita } from '../../../data/services/citaService';
import type { ConsumidorStackParams } from '../../../app/navigation/types';

const DUR_DEFAULT = 30;
const DIA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const pad = (n: number) => String(n).padStart(2, '0');

// Horas para el modo "solicitud" (cada 30 min, 8:00–20:00).
const HORAS_SOLICITUD: string[] = [];
for (let h = 8; h <= 20; h++) for (const m of [0, 30]) HORAS_SOLICITUD.push(`${pad(h)}:${pad(m)}`);

function fechaISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function horaDeISO(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function CitaScreen() {
  const { params } = useRoute<RouteProp<ConsumidorStackParams, 'Cita'>>();
  const navigation = useNavigation();
  const { perfil } = useSession();
  const esAgenda = params.modo === 'agenda';

  const dias = React.useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const [fechaSel, setFechaSel] = useState<Date>(dias[0]);
  const [servicio, setServicio] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null); // ISO (agenda) u "HH:MM" (solicitud)
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Modo agenda: cargar huecos al cambiar de fecha.
  useEffect(() => {
    if (!esAgenda) return;
    let vivo = true;
    setCargandoSlots(true);
    setSeleccion(null);
    slotsDisponibles(params.negocioId, fechaISO(fechaSel))
      .then(s => { if (vivo) setSlots(s); })
      .catch(() => { if (vivo) setSlots([]); })
      .finally(() => { if (vivo) setCargandoSlots(false); });
    return () => { vivo = false; };
  }, [esAgenda, fechaSel, params.negocioId]);

  // Horas válidas para solicitud (si es hoy, solo futuras).
  const horasSolicitud = React.useMemo(() => {
    const esHoy = fechaISO(fechaSel) === fechaISO(new Date());
    if (!esHoy) return HORAS_SOLICITUD;
    const ahora = new Date();
    return HORAS_SOLICITUD.filter(hm => {
      const [h, m] = hm.split(':').map(Number);
      return h > ahora.getHours() || (h === ahora.getHours() && m > ahora.getMinutes());
    });
  }, [fechaSel]);

  async function confirmar() {
    if (!seleccion) { setError('Elige un horario.'); return; }
    if (!perfil?.cliente_id) { setError('Sesión no válida.'); return; }
    setEnviando(true);
    setError('');
    try {
      if (esAgenda) {
        await agendarCita(params.negocioId, seleccion, servicio, DUR_DEFAULT);
      } else {
        const [h, m] = seleccion.split(':').map(Number);
        const inicia = new Date(fechaSel);
        inicia.setHours(h, m, 0, 0);
        await solicitarCita(params.negocioId, perfil.cliente_id, servicio, inicia.toISOString(), DUR_DEFAULT);
      }
      setExito(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agendar.');
    }
    setEnviando(false);
  }

  if (exito) {
    return (
      <Screen>
        <View style={styles.centro}>
          <AppText variant="hero">✅</AppText>
          <AppText variant="title" style={styles.exitoTit}>
            {esAgenda ? 'Cita confirmada' : 'Solicitud enviada'}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.exitoSub}>
            {esAgenda
              ? 'Tu reserva quedó agendada. Te esperamos.'
              : 'El negocio recibirá tu solicitud y la confirmará pronto.'}
          </AppText>
          <AppButton titulo="Listo" onPress={() => navigation.goBack()} style={styles.boton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Agendar cita</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.sub}>{params.nombre}</AppText>

      {/* Servicio */}
      <AppText variant="subtitle" style={styles.seccion}>Servicio (opcional)</AppText>
      <TextInput
        value={servicio}
        onChangeText={setServicio}
        placeholder="Ej. Corte, consulta…"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />

      {/* Fecha */}
      <AppText variant="subtitle" style={styles.seccion}>Día</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
        {dias.map(d => {
          const activo = fechaISO(d) === fechaISO(fechaSel);
          return (
            <Pressable key={d.toISOString()} onPress={() => { setFechaSel(d); setSeleccion(null); }}
              style={[styles.diaPill, activo && styles.diaPillOn]}>
              <AppText variant="caption" color={activo ? '#fff' : colors.textSecondary}>{DIA_CORTO[d.getDay()]}</AppText>
              <AppText variant="subtitle" color={activo ? '#fff' : colors.textPrimary}>{d.getDate()}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Horarios */}
      <AppText variant="subtitle" style={styles.seccion}>Horario</AppText>
      {esAgenda && cargandoSlots ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : esAgenda && slots.length === 0 ? (
        <AppText color={colors.textSecondary}>No hay horarios disponibles este día.</AppText>
      ) : (
        <View style={styles.horas}>
          {(esAgenda ? slots : horasSolicitud).map(item => {
            const etiqueta = esAgenda ? horaDeISO(item) : item;
            const activo = seleccion === item;
            return (
              <Pressable key={item} onPress={() => setSeleccion(item)}
                style={[styles.horaPill, activo && styles.horaPillOn]}>
                <AppText variant="body" color={activo ? '#fff' : colors.textPrimary}>{etiqueta}</AppText>
              </Pressable>
            );
          })}
          {!esAgenda && horasSolicitud.length === 0 && (
            <AppText color={colors.textSecondary}>No quedan horas hoy. Elige otro día.</AppText>
          )}
        </View>
      )}

      {error ? <AppText color={colors.danger} style={styles.error}>{error}</AppText> : null}
      <AppButton
        titulo={esAgenda ? 'Confirmar reserva' : 'Enviar solicitud'}
        onPress={confirmar}
        cargando={enviando}
        style={styles.boton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  seccion: { marginTop: spacing.xl, marginBottom: spacing.sm },
  input: {
    borderRadius: radii.md, backgroundColor: colors.surface,
    padding: spacing.md, fontSize: 15, color: colors.textPrimary,
  },
  dias: { gap: spacing.sm, paddingVertical: spacing.xs },
  diaPill: {
    width: 56, paddingVertical: spacing.sm, borderRadius: radii.md,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  diaPillOn: { backgroundColor: colors.primary },
  horas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  horaPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.md, backgroundColor: colors.surface, minWidth: 72, alignItems: 'center',
  },
  horaPillOn: { backgroundColor: colors.primary },
  loader: { alignSelf: 'flex-start' },
  error: { marginTop: spacing.md },
  boton: { marginTop: spacing.xl },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  exitoTit: { marginTop: spacing.md },
  exitoSub: { textAlign: 'center', marginTop: spacing.sm },
});
