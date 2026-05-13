// components/EstadoModal.tsx

import { useTheme } from "@/hooks/useTheme";
import { EstadoMiembro } from "@/app/services/groupApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ─── Configuración de estados (exportada para reusar en grupo/[id].tsx) ────────
export type EstadoConfig = {
  label: string;
  icon:  React.ComponentProps<typeof Ionicons>["name"];
  color: (c: ReturnType<typeof useTheme>["colors"]) => string;
};

export const ESTADOS: Record<EstadoMiembro, EstadoConfig> = {
  pendiente:  { label: "En casa",         icon: "home-outline",         color: c => c.primary  },
  en_camino:  { label: "En camino",       icon: "arrow-forward-circle", color: c => c.confirm  },
  llegue:     { label: "En el evento",    icon: "checkmark-circle",     color: c => c.success  },
  cancelado:  { label: "Cancelado",       icon: "close-circle",         color: c => c.error    },
  esperando:  { label: "Esperando fuera", icon: "hourglass-outline",    color: c => c.warning  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  visible:      boolean;
  estadoActual: EstadoMiembro | undefined;
  onSelect:     (estado: EstadoMiembro) => void;
  onClose:      () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
export function EstadoModal({ visible, estadoActual, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: colors.card }]}>

              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.titulo, { color: colors.text }]}>¿Cómo estás?</Text>

              {(Object.entries(ESTADOS) as [EstadoMiembro, EstadoConfig][]).map(([key, cfg]) => {
                const activo = estadoActual === key;
                const color  = cfg.color(colors);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.opcion,
                      { borderBottomColor: colors.border },
                      activo && { backgroundColor: color + "10" },
                    ]}
                    onPress={() => {
                      onSelect(key);
                      onClose();
                    }}
                  >
                    <View style={[styles.iconBox, { borderColor: color, backgroundColor: color + "18" }]}>
                      <Ionicons name={cfg.icon} size={20} color={color} />
                    </View>
                    <Text style={[styles.opcionText, { color: activo ? color : colors.text }]}>
                      {cfg.label}
                    </Text>
                    {activo && <Ionicons name="checkmark" size={20} color={color} />}
                  </TouchableOpacity>
                );
              })}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  content:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: "center",
                marginTop: 12, marginBottom: 8 },
  titulo:     { fontSize: 16, fontWeight: "700", paddingHorizontal: 20, paddingVertical: 12 },
  opcion:     { flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 20, paddingVertical: 14,
                borderBottomWidth: StyleSheet.hairlineWidth },
  opcionText: { flex: 1, fontSize: 16, fontWeight: "500" },
  iconBox:    { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5,
                alignItems: "center", justifyContent: "center" },
});