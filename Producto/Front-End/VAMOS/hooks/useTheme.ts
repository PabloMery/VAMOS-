// app/hooks/useTheme.ts
//
// Hook principal para acceder al sistema de diseño.
// Ahora respeta la preferencia del usuario guardada en ThemeContext
// (claro / oscuro / sistema).

import { buildTheme, Theme } from "@/constants/theme";
import { useThemeMode } from "@/context/ThemeContext";

export function useTheme(): Theme {
  const { esquemaActivo } = useThemeMode();
  return buildTheme(esquemaActivo);
}