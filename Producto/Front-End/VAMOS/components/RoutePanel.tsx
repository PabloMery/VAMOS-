// components/RoutePanel.tsx

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import { Event } from "@/types/Event";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos exportados (index.tsx los importa) ─────────────────────────────────
export type RouteStep = {
  html_instructions: string;
  distance: { text: string };
  duration: { text: string };
};
export type RouteMode = "WALKING" | "DRIVING" | "TRANSIT";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

function iconoPaso(texto: string, esUltimo: boolean): IoniconName {
  if (esUltimo) return "location";
  const t = texto.toLowerCase();
  if (t.includes("izquierda") || t.includes("left"))  return "arrow-back";
  if (t.includes("derecha")   || t.includes("right")) return "arrow-forward";
  return "arrow-up";
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  event:       Event | null;
  routeMode:   RouteMode;
  routeInfo:   { km: number; min: number } | null;
  routeSteps:  RouteStep[];
  routeError:  boolean;
  onClose:     () => void;
  onModeChange: (mode: RouteMode) => void;
};

const MODOS: { key: RouteMode; icon: IoniconName; label: string }[] = [
  { key: "WALKING", icon: "walk", label: "Caminando"  },
  { key: "DRIVING", icon: "car",  label: "En auto"    },
  { key: "TRANSIT", icon: "bus",  label: "Transporte" },
];

// ─────────────────────────────────────────────────────────────────────────────
export function RoutePanel({
  event,
  routeMode,
  routeInfo,
  routeSteps,
  routeError,
  onClose,
  onModeChange,
}: Props) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={!!event} onClose={onClose} initialSnap="half">

      <View style={styles.content}>

        {/* Cabecera: ícono + nombre del evento + botón cerrar */}
        <View style={styles.header}>
          <Ionicons name="location" size={18} color={colors.confirm} />
          <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
            {event?.nombre_evento}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Selector de modo de transporte */}
        <View style={styles.modeTabs}>
          {MODOS.map((m) => {
            const activo = routeMode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modeTab,
                  { borderColor: activo ? colors.confirm : colors.border },
                  activo && { backgroundColor: colors.confirm + "20" },
                ]}
                onPress={() => onModeChange(m.key)}
              >
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={activo ? colors.confirm : colors.subtext}
                />
                <Text style={[styles.modeTabLabel, { color: activo ? colors.confirm : colors.subtext }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cargando ruta */}
        {!routeInfo && !routeError && (
          <ActivityIndicator size="small" color={colors.confirm} style={styles.loader} />
        )}

        {/* Error al calcular ruta */}
        {routeError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            No se encontró ruta para este modo de transporte.
          </Text>
        )}

        {/* Resumen + instrucciones */}
        {routeInfo && (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Distancia</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {routeInfo.km.toFixed(1)}
                  <Text style={[styles.summaryUnit, { color: colors.subtext }]}> km</Text>
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.confirm + "15" }]}>
                <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Tiempo est.</Text>
                <Text style={[styles.summaryValue, { color: colors.confirm }]}>
                  {routeInfo.min}
                  <Text style={[styles.summaryUnit, { color: colors.subtext }]}> min</Text>
                </Text>
              </View>
            </View>

            {routeSteps.length > 0 && (
              <>
                <Text style={[styles.stepsTitle, { color: colors.subtext }]}>Instrucciones</Text>
                <ScrollView
                  style={styles.stepsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {routeSteps.map((step, index) => {
                    const esUltimo = index === routeSteps.length - 1;
                    const texto    = stripHtml(step.html_instructions);
                    const icono    = iconoPaso(texto, esUltimo);
                    const color    = esUltimo ? colors.primary : colors.confirm;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.step,
                          !esUltimo && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                        ]}
                      >
                        <View style={[styles.stepIconWrap, { backgroundColor: color + "20" }]}>
                          <Ionicons name={icono} size={14} color={color} />
                        </View>
                        <Text
                          style={[styles.stepText, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {texto}
                        </Text>
                        {!esUltimo && (
                          <Text style={[styles.stepDist, { color: colors.subtext }]}>
                            {step.distance.text}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </>
        )}

      </View>
    </BottomSheet>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content:      { flex: 1, paddingHorizontal: 16, paddingBottom: 30 },
  header:       { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eventName:    { flex: 1, fontWeight: "bold", fontSize: 14 },
  modeTabs:     { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeTab:      { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 4 },
  modeTabLabel: { fontSize: 11 },
  loader:       { marginVertical: 16 },
  errorText:    { fontSize: 13, marginVertical: 8, paddingHorizontal: 4 },
  summaryRow:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryCard:  { flex: 1, borderRadius: 12, padding: 12 },
  summaryLabel: { fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: "bold" },
  summaryUnit:  { fontSize: 13, fontWeight: "normal" },
  stepsTitle:   { fontSize: 12, marginBottom: 6 },
  stepsList:    { flex: 1 },
  step:         { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  stepIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepText:     { flex: 1, fontSize: 12, lineHeight: 17 },
  stepDist:     { fontSize: 11, flexShrink: 0 },
});