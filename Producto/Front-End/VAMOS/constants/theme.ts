// app/constants/theme.ts
//
// Fuente única de verdad de toda la apariencia de la app.
// Combina la estructura Colors.light/dark (compatible con useThemeColor del
// template Expo) con tokens de spacing, radius, tipografía y sombras.

// ===========================================================================
// COLORES — paleta de marca naranjo + morado, con variantes light y dark
// ===========================================================================

const lightColors = {
  // --- Compatibilidad con código viejo (no borrar) ---
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  subtle: "#9CA3AF",
  border: "#E5E7EB",
  tabBar: "#FFFFFF",
  primary: "#8B5CF6",    // antes era azul iOS, ahora morado de marca
  danger: "#EF4444",
  save: "#8B5CF6",       // Guardar → morado (convención del marker)
  confirm: "#F97316",    // Confirmar → naranjo
  purple: "#8B5CF6",
  orange: "#F97316",

  // --- Tokens semánticos (preferidos para código nuevo) ---
  primaryDark: "#7C3AED",
  primaryLight: "#A78BFA",
  primarySoft: "#EDE9FE",

  accent: "#F97316",
  accentDark: "#EA580C",
  accentLight: "#FB923C",
  accentSoft: "#FFEDD5",

  surface: "#F9FAFB",
  surfaceAlt: "#F3F4F6",

  textMuted: "#6B7280",
  textInverse: "#FFFFFF",

  // Estados del marker en el mapa
  eventNeutral: "#6B7280",
  eventSaved: "#8B5CF6",
  eventConfirmed: "#F97316",

  // Semánticos
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

// Mismas claves que light, pero con colores adaptados a fondo oscuro.
// `typeof lightColors` fuerza que TypeScript te avise si te falta alguna.
const darkColors: typeof lightColors = {
  background: "#0F0F11",
  card: "#1C1C1E",
  text: "#FAFAFA",
  subtext: "#A1A1AA",
  subtle: "#71717A",
  border: "#2C2C2E",
  tabBar: "#1C1C1E",
  primary: "#A78BFA",   // morado más claro: mejor contraste sobre negro
  danger: "#F87171",
  save: "#A78BFA",
  confirm: "#FB923C",
  purple: "#A78BFA",
  orange: "#FB923C",

  primaryDark: "#8B5CF6",
  primaryLight: "#C4B5FD",
  primarySoft: "#3B2A66",

  accent: "#FB923C",
  accentDark: "#F97316",
  accentLight: "#FDBA74",
  accentSoft: "#5C3115",

  surface: "#27272A",
  surfaceAlt: "#3F3F46",

  textMuted: "#A1A1AA",
  textInverse: "#0F0F11",

  eventNeutral: "#A1A1AA",
  eventSaved: "#A78BFA",
  eventConfirmed: "#FB923C",

  success: "#34D399",
  error: "#F87171",
  warning: "#FBBF24",
  info: "#60A5FA",
};

// Estructura que espera useThemeColor (no tocar el shape).
export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// ===========================================================================
// RESTO DEL SISTEMA DE DISEÑO — no cambia con dark mode
// ===========================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
};

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ===========================================================================
// THEME UNIFICADO — lo que devuelve useTheme()
// ===========================================================================

export function buildTheme(scheme: "light" | "dark" = "light") {
  return {
    colors: scheme === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    shadow,
  };
}

export type Theme = ReturnType<typeof buildTheme>;