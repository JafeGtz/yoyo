import { PermissionsAndroid, Platform } from 'react-native';

// Carga perezosa para que un módulo nativo faltante (sin rebuild) no rompa el import.
type GeoLib = typeof import('@react-native-community/geolocation');
function geo(): GeoLib['default'] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-community/geolocation').default;
}

/**
 * Pide permiso y devuelve la ubicación actual, o null si el usuario la niega,
 * falla o tarda demasiado. Nunca lanza (no bloquea el escaneo).
 */
export async function obtenerUbicacion(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Ubicación',
          message: 'yoyo usa tu ubicación para confirmar que estás en el negocio al registrar tu visita.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Ahora no',
        },
      );
      if (res !== PermissionsAndroid.RESULTS.GRANTED) return null;
    }
    return await new Promise(resolve => {
      geo().getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    });
  } catch {
    return null;
  }
}
