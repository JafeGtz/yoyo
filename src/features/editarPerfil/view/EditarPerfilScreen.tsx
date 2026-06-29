import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/ui/Screen';
import { AppText } from '../../../shared/ui/AppText';
import { AppInput } from '../../../shared/ui/AppInput';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../core/auth/SessionProvider';
import { cerrarSesion } from '../../../core/auth/authService';
import { supabase } from '../../../data/supabase/supabaseClient';

export function EditarPerfilScreen() {
  const navigation = useNavigation();
  const { perfil, recargarPerfil } = useSession();
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [cumpleanos, setCumpleanos] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!perfil?.cliente_id) return;
    supabase.from('cliente').select('nombre, celular, cumpleanos').eq('id', perfil.cliente_id).single()
      .then(({ data }) => {
        if (data) {
          setNombre(data.nombre ?? '');
          setCelular(data.celular ?? '');
          setCumpleanos(data.cumpleanos ?? '');
        }
      });
  }, [perfil?.cliente_id]);

  async function guardar() {
    setGuardando(true);
    setMsg('');
    const { error } = await supabase.from('cliente')
      .update({ nombre, celular: celular || null, cumpleanos: cumpleanos || null })
      .eq('id', perfil?.cliente_id);
    setGuardando(false);
    if (error) setMsg(error.message);
    else {
      setMsg('Datos guardados ✓');
      recargarPerfil();
    }
  }

  function confirmarEliminar() {
    Alert.alert(
      'Eliminar cuenta',
      'Esto borrará tu cuenta y todos tus datos de forma permanente. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: eliminar },
      ],
    );
  }

  async function eliminar() {
    const { data, error } = await supabase.functions.invoke('eliminar-cuenta', { body: {} });
    if (error || data?.error) {
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Intenta de nuevo.');
      return;
    }
    await cerrarSesion();
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <AppText variant="title" color={colors.primary}>‹</AppText>
      </Pressable>
      <AppText variant="title">Datos personales</AppText>

      <View style={styles.form}>
        <AppInput label="Nombre" value={nombre} onChangeText={setNombre} />
        <AppInput label="Celular" value={celular} onChangeText={setCelular} keyboardType="phone-pad" />
        <AppInput label="Cumpleaños (AAAA-MM-DD)" value={cumpleanos} onChangeText={setCumpleanos} placeholder="1990-05-10" />
      </View>

      {msg ? <AppText color={msg.includes('✓') ? colors.mint : colors.danger} style={styles.msg}>{msg}</AppText> : null}

      <AppButton titulo="Guardar" onPress={guardar} cargando={guardando} />

      <View style={styles.peligro}>
        <AppText variant="caption" color={colors.textSecondary} style={styles.aviso}>
          Al eliminar tu cuenta, se borran tus visitas, beneficios e insignias de forma permanente.
        </AppText>
        <Pressable onPress={confirmarEliminar} style={styles.eliminar} hitSlop={8}>
          <AppText variant="subtitle" color={colors.danger}>Eliminar mi cuenta</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: spacing.lg },
  msg: { marginBottom: spacing.md },
  peligro: { marginTop: spacing.xl * 2, alignItems: 'center' },
  aviso: { textAlign: 'center', marginBottom: spacing.md },
  eliminar: { padding: spacing.sm },
});
