// components/ui/BottomSheet.tsx
//
// Bottom sheet reutilizable para EventDetailSheet, AIChatModal, RoutePanel, etc.
//
// ARQUITECTURA: anima la propiedad `top` (no translateY).
// Esto hace que el panel siempre tenga exactamente la altura visible,
// permitiendo que flex layout funcione correctamente dentro.
//
// Resultado: el contenido siempre llena el área visible — el input del chat
// queda al fondo de lo que se ve, no al fondo del panel extendido fuera de pantalla.
//
// GESTOS:
//   Arrastra hacia arriba  → pantalla completa
//   Arrastra hacia abajo   → media pantalla (o cierra si baja >80px del punto actual)
//   Desliza rápido abajo   → cierra directamente
//
// SIN OVERLAY: el mapa queda interactuable en todo momento.
//
// PROP keyboardOffset: pasar la altura del teclado (desde AIChatModal) para
// que el panel suba automáticamente y el input quede sobre el teclado.

import { useTheme } from "@/hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";

// ─── Constantes ───────────────────────────────────────────────────────────────
const { height: SH } = Dimensions.get("window");

export const SNAP_HALF   = SH * 0.48;  // top en modo mitad    → visible: 52%
export const SNAP_FULL   = SH * 0.10;  // top en modo completo → visible: 90%
const        SNAP_CLOSED = SH * 1.05;  // fuera de pantalla
const        SNAP_MID    = (SNAP_FULL + SNAP_HALF) / 2;
const        CLOSE_THRESHOLD = 80;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialSnap?: "half" | "full";
  // Altura del teclado — mueve el panel hacia arriba para que el input no quede tapado
  keyboardOffset?: number;
};

// ─────────────────────────────────────────────────────────────────────────────

export function BottomSheet({
  visible,
  onClose,
  children,
  initialSnap = "half",
  keyboardOffset = 0,
}: Props) {
  const theme = useTheme();

  // Mantiene el componente montado durante la animación de salida
  const [isRendered, setIsRendered] = useState(visible);

  const targetSnap  = initialSnap === "full" ? SNAP_FULL : SNAP_HALF;
  const topAnim     = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const currentSnap = useRef(targetSnap);

  // ── Mostrar / ocultar ──────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      currentSnap.current = targetSnap;
      Animated.spring(topAnim, {
        toValue: targetSnap,
        useNativeDriver: false,
        friction: 10,
        tension: 80,
      }).start();
    } else {
      Animated.timing(topAnim, {
        toValue: SNAP_CLOSED,
        duration: 240,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [visible]);

  // ── Snap a posición ────────────────────────────────────────────────────────
  const snapTo = (target: number) => {
    currentSnap.current = target;
    Animated.spring(topAnim, {
      toValue: target,
      useNativeDriver: false,
      friction: 8,
      tension: 65,
    }).start();
  };

  // ── PanResponder — solo activo en el drag handle ───────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,

      onPanResponderGrant: () => {
        topAnim.setOffset(currentSnap.current);
        topAnim.setValue(0);
      },

      onPanResponderMove: (_, gs) => {
        // Hacia arriba: hasta SNAP_FULL. Hacia abajo: libre (para gesto de cierre)
        const raw = currentSnap.current + gs.dy;
        topAnim.setValue(Math.max(SNAP_FULL, raw) - currentSnap.current);
      },

      onPanResponderRelease: (_, gs) => {
        topAnim.flattenOffset();
        const raw     = currentSnap.current + gs.dy;
        const current = Math.max(SNAP_FULL, raw);

        // Cerrar: pasó el umbral hacia abajo O fue un desliz rápido
        if (current > SNAP_HALF + CLOSE_THRESHOLD || (gs.vy > 0.5 && gs.dy > 0)) {
          Animated.timing(topAnim, {
            toValue: SNAP_CLOSED,
            duration: 220,
            useNativeDriver: false,
          }).start(() => onClose());
          return;
        }

        // Snap al punto más cercano entre FULL y HALF
        snapTo(current <= SNAP_MID ? SNAP_FULL : SNAP_HALF);
      },
    })
  ).current;

  if (!isRendered) return null;

  return (
    <Animated.View
      style={[
        styles.sheet,
        { backgroundColor: theme.colors.card },
        {
          // top animado controla qué porcentaje de pantalla ocupa el panel
          top: topAnim,
          // translateY sube el panel cuando el teclado aparece
          transform: [{ translateY: -keyboardOffset }],
        },
      ]}
    >
      {/* Asa — única zona con PanResponder, no interfiere con ScrollView */}
      <View style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={[styles.handleBar, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Contenido — flex: 1 hace que llene exactamente el área visible */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Sin height fijo — el panel ocupa de `top` hasta el fondo de la pantalla
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1, // llena todo el espacio desde el asa hasta el fondo del panel
  },
});