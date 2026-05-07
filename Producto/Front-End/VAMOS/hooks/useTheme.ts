// app/hooks/useTheme.ts
//
// Hook principal para acceder al sistema de diseño desde cualquier componente.
// Detecta automáticamente si el usuario está en modo claro u oscuro.
//
// Uso:
//   const theme = useTheme();
//   <View style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.md }} />
 
import { buildTheme, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
 
export function useTheme(): Theme {
  const scheme = useColorScheme() ?? "light";
  return buildTheme(scheme);
}
 