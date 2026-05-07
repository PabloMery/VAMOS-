// app/hooks/useColors.ts
//
// SHIM: hook legacy que devuelve solo los colores del tema actual.
// Se mantiene para que el código viejo siga funcionando sin cambios.
//
// Para código nuevo, usá `useTheme()` directamente — te da acceso también
// a spacing, radius, tipografía y sombras.
 
import { useTheme } from "@/hooks/useTheme";
 
/**
 * @deprecated Usá `useTheme()` desde `@/hooks/useTheme` en su lugar.
 */
export function useColors() {
  return useTheme().colors;
}
 