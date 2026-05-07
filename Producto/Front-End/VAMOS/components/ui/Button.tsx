// app/components/ui/Button.tsx
//
// Botón estandarizado. Los botones de toda la app deberían pasar por aquí
// para que la marca se vea consistente.
//
// Variantes:
//   - primary: relleno morado (acción principal)
//   - accent:  relleno naranjo (CTA fuerte, ej: "Confirmar asistencia")
//   - outline: borde morado, fondo transparente (acción secundaria)
//   - ghost:   sin borde, sin fondo (acción terciaria)
//
// Tamaños: sm | md | lg

import { useTheme } from "@/hooks/useTheme";
import { ActivityIndicator, Pressable, Text } from "react-native";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  // Colores según variante
  const variantStyle = {
    primary: {
      bg: theme.colors.primary,
      border: theme.colors.primary,
      text: theme.colors.textInverse,
    },
    accent: {
      bg: theme.colors.accent,
      border: theme.colors.accent,
      text: theme.colors.textInverse,
    },
    outline: {
      bg: "transparent",
      border: theme.colors.primary,
      text: theme.colors.primary,
    },
    ghost: {
      bg: "transparent",
      border: "transparent",
      text: theme.colors.primary,
    },
  }[variant];

  // Padding y tamaño de fuente según size
  const sizeStyle = {
    sm: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.fontSize.sm,
    },
    md: {
      paddingVertical: theme.spacing.sm + 4, // 12
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.fontSize.base,
    },
    lg: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      fontSize: theme.fontSize.lg,
    },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: variantStyle.bg,
        borderColor: variantStyle.border,
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        paddingVertical: sizeStyle.paddingVertical,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
      })}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} />
      ) : (
        <Text
          style={{
            color: variantStyle.text,
            fontSize: sizeStyle.fontSize,
            fontWeight: theme.fontWeight.semibold,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}