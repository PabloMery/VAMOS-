// app/components/EventDetailSheet.tsx
//
// Panel inferior que muestra el detalle de un evento.
// Se desliza hacia arriba sin oscurecer el mapa detrás.
// Se cierra arrastrando hacia abajo o tocando el área del mapa.

import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/use-theme-color";
import type { Event } from "@/types/Event";

// ─── Tipos de props ────────────────────────────────────────────────────────────
type Props = {
  event: Event | null;
  isSaved: boolean;
  isConfirmed: boolean;
  onClose: () => void;
  onSave: () => void;
  onConfirm: () => void;
  onNavigate: () => void;
};

// ─── Constante de desplazamiento (suficiente para esconder el panel) ───────────
const SLIDE_OFFSET = 700;
const DISMISS_THRESHOLD = 80; // px hacia abajo para cerrar con gesto

// ─────────────────────────────────────────────────────────────────────────────

export function EventDetailSheet({
  event,
  isSaved,
  isConfirmed,
  onClose,
  onSave,
  onConfirm,
  onNavigate,
}: Props) {
  const colors = useColors();

  // slideY: controla si el panel está visible (0) u oculto (SLIDE_OFFSET)
  const slideY = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  // dragY: acumula el desplazamiento del gesto de arrastre
  const dragY  = useRef(new Animated.Value(0)).current;

  // Animar entrada/salida cuando cambia el evento seleccionado
  useEffect(() => {
    if (event) {
      dragY.setValue(0); // resetear gesto anterior
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
        tension: 80,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: SLIDE_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [event]);

  // PanResponder en el asa — arrastra solo hacia abajo, cierra si pasa el umbral
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD) {
          onClose();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // No renderizar nada si no hay evento (el panel ya está fuera de pantalla
  // por la animación, pero evitamos calcular el JSX innecesariamente)
  if (!event) return null;

  // ── Datos derivados ──────────────────────────────────────────────────────
  const horario = event.horario_variable
    ? "Horario variable"
    : event.hora_inicio
    ? `${event.hora_inicio}${event.hora_fin ? " – " + event.hora_fin : ""}`
    : "Sin horario definido";

  const precioTexto =
    event.precio === null ? "Sin info" :
    event.precio === 0    ? "Gratis"   :
    `$${event.precio.toLocaleString("es-CL")}`;

  const precioColor =
    event.precio === 0 ? colors.success ?? "#22c55e" :
    event.precio === null ? colors.subtext : colors.primary;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Área transparente detrás del panel — toca para cerrar */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Panel deslizable */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.card },
          {
            transform: [
              { translateY: Animated.add(slideY, dragY) },
            ],
          },
        ]}
      >
        {/* ── Asa y encabezado ── */}
        <View style={styles.handle} {...panResponder.panHandlers}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Chips: categoría + precio */}
          <View style={styles.chipRow}>
            {event.categoria ? (
              <View style={[styles.chip, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary }]}>
                  {event.categoria}
                </Text>
              </View>
            ) : null}

            <View style={[styles.chip, { backgroundColor: precioColor + "20" }]}>
              <Ionicons name="wallet-outline" size={12} color={precioColor} />
              <Text style={[styles.chipText, { color: precioColor }]}>
                {precioTexto}
              </Text>
            </View>

            {event.requiere_inscripcion && (
              <View style={[styles.chip, { backgroundColor: colors.confirm + "20" }]}>
                <Ionicons name="clipboard-outline" size={12} color={colors.confirm} />
                <Text style={[styles.chipText, { color: colors.confirm }]}>Inscripción</Text>
              </View>
            )}
          </View>

          {/* Nombre del evento */}
          <Text style={[styles.title, { color: colors.text }]}>
            {event.nombre_evento}
          </Text>

          {/* Estado del evento (si existe) */}
          {event.estado_evento ? (
            <Text style={[styles.status, { color: colors.subtext }]}>
              {event.estado_evento}
            </Text>
          ) : null}

          {/* Separador */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Filas de información */}
          <InfoRow
            icon="location-outline"
            text={event.lugar_texto}
            color={colors.confirm}
            textColor={colors.text}
          />
          <InfoRow
            icon="calendar-outline"
            text={event.fecha_evento}
            color={colors.confirm}
            textColor={colors.text}
          />
          <InfoRow
            icon="time-outline"
            text={horario}
            color={colors.confirm}
            textColor={colors.text}
          />

          {/* Separador */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Botones de acción */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isSaved
                    ? colors.primary
                    : colors.primary + "18",
                  borderColor: colors.primary,
                },
              ]}
              onPress={onSave}
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={18}
                color={isSaved ? "white" : colors.primary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isSaved ? "white" : colors.primary },
                ]}
              >
                {isSaved ? "Guardado" : "Guardar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isConfirmed
                    ? colors.confirm
                    : colors.confirm + "18",
                  borderColor: colors.confirm,
                },
              ]}
              onPress={onConfirm}
            >
              <Ionicons
                name={isConfirmed ? "checkmark-circle" : "checkmark-circle-outline"}
                size={18}
                color={isConfirmed ? "white" : colors.confirm}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isConfirmed ? "white" : colors.confirm },
                ]}
              >
                {isConfirmed ? "Confirmado" : "Confirmar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón cómo llegar */}
          <TouchableOpacity
            style={[styles.navigateBtn, { backgroundColor: colors.confirm }]}
            onPress={onNavigate}
          >
            <Ionicons name="navigate" size={18} color="white" />
            <Text style={styles.navigateBtnText}>Cómo llegar</Text>
          </TouchableOpacity>

          {/* Fuente */}
          <Text style={[styles.source, { color: colors.subtle }]}>
            Fuente: {event.origen_datos}
          </Text>
        </ScrollView>
      </Animated.View>
    </>
  );
}

// ─── Subcomponente para filas de información ──────────────────────────────────
function InfoRow({
  icon,
  text,
  color,
  textColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text?: string | null;
  color: string;
  textColor: string;
}) {
  if (!text) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={color} style={styles.infoIcon} />
      <Text style={[styles.infoText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },

  handle: { paddingTop: 10, paddingBottom: 4, alignItems: "center" },
  handleBar: { width: 40, height: 4, borderRadius: 2 },

  content: { paddingHorizontal: 20, paddingBottom: 36 },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  title:  { fontSize: 18, fontWeight: "bold", lineHeight: 24, marginBottom: 4 },
  status: { fontSize: 13, fontStyle: "italic", marginBottom: 8 },

  divider: { height: 0.5, marginVertical: 12 },

  infoRow:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  infoIcon: { marginRight: 10, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" },

  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  navigateBtnText: { color: "white", fontSize: 15, fontWeight: "700" },

  source: { fontSize: 11, textAlign: "center", marginTop: 16 },
});