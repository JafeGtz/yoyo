// Sistema de diseño basado en el UI Kit (docs/ui-kit): índigo/violeta,
// tarjetas redondeadas con sombra, botones píldora, acentos menta/rosa/dorado.

export const colors = {
  primary: '#4F3CE0',
  primaryDark: '#3A2BB8',
  background: '#FFFFFF',
  darkBg: '#151833', // fondo oscuro (gamificación / podio)
  darkSurface: '#20244A', // tarjetas sobre fondo oscuro
  darkBorder: 'rgba(255,255,255,0.09)',
  lavenderBg: '#EEEBFB', // fondo de onboarding/auth
  surface: '#F4F3FA', // tarjetas claras / filas de ajustes
  lavender: '#ECE9FC', // tarjetas de acento
  mint: '#34D6A8', // tickets / éxito
  mintSoft: '#DAF6EE',
  textPrimary: '#1B1B2F',
  textSecondary: '#8A899C',
  border: '#ECECF3',
  white: '#FFFFFF',
  danger: '#EF4444',
  success: '#34D6A8',
} as const;

// Paleta de acentos que combinan con el morado (menta, rosa, dorado, turquesa, coral).
// Solo morado y verde (los únicos acentos permitidos en la app).
export const acentos = [
  { fuerte: '#4F3CE0', suave: '#ECE9FC' },
  { fuerte: '#34D6A8', suave: '#DAF6EE' },
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 38, fontWeight: '800' as const, lineHeight: 44 },
  title: { fontSize: 26, fontWeight: '800' as const },
  subtitle: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
} as const;

// Sombra suave reutilizable para tarjetas.
export const cardShadow = {
  shadowColor: '#1B1B2F',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;
