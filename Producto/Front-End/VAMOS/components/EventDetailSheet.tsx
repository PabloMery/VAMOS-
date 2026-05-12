// components/EventDetailSheet.tsx

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Event } from "@/types/Event";

type Props = {
  event:          Event | null;
  isSaved:        boolean;
  isConfirmed:    boolean;
  grupoId?:       string | null;       // id del grupo si el usuario ya tiene uno para este evento
  onClose:        () => void;
  onSave:         () => void;
  onConfirm:      () => void;
  onNavigate:     () => void;
  onCreateGroup?: () => void;          // crear grupo (solo aparece si isConfirmed && !grupoId)
  onViewGroup?:   () => void;          // ver grupo  (solo aparece si isConfirmed &&  grupoId)
};

export function EventDetailSheet({
  event, isSaved, isConfirmed, grupoId,
  onClose, onSave, onConfirm, onNavigate,
  onCreateGroup, onViewGroup,
}: Props) {
  const theme = useTheme();

  const lastEvent = useRef<Event | null>(null);
  if (event) lastEvent.current = event;
  const ev = lastEvent.current;

  const horario = !ev ? "" :
    ev.horario_variable ? "Horario variable" :
    ev.hora_inicio ? `${ev.hora_inicio}${ev.hora_fin ? " – " + ev.hora_fin : ""}` : "Sin horario";

  const precioTexto = !ev ? "" :
    ev.precio === null ? "Sin info" : ev.precio === 0 ? "Gratis" : `$${ev.precio.toLocaleString("es-CL")}`;

  const precioColor = !ev ? theme.colors.subtext :
    ev.precio === 0 ? (theme.colors.success ?? "#22c55e") :
    ev.precio === null ? theme.colors.subtext : theme.colors.primary;

  return (
    <BottomSheet visible={event !== null} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {ev && (
          <>
            {/* Chips de categoría / precio / inscripción */}
            <View style={styles.chipRow}>
              {ev.categoria ? (
                <View style={[styles.chip, { backgroundColor: theme.colors.primary + "20" }]}>
                  <Ionicons name="pricetag-outline" size={12} color={theme.colors.primary} />
                  <Text style={[styles.chipText, { color: theme.colors.primary }]}>{ev.categoria}</Text>
                </View>
              ) : null}
              <View style={[styles.chip, { backgroundColor: precioColor + "20" }]}>
                <Ionicons name="wallet-outline" size={12} color={precioColor} />
                <Text style={[styles.chipText, { color: precioColor }]}>{precioTexto}</Text>
              </View>
              {ev.requiere_inscripcion && (
                <View style={[styles.chip, { backgroundColor: theme.colors.confirm + "20" }]}>
                  <Ionicons name="clipboard-outline" size={12} color={theme.colors.confirm} />
                  <Text style={[styles.chipText, { color: theme.colors.confirm }]}>Inscripción</Text>
                </View>
              )}
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>{ev.nombre_evento}</Text>
            {ev.estado_evento ? (
              <Text style={[styles.status, { color: theme.colors.subtext }]}>{ev.estado_evento}</Text>
            ) : null}

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <InfoRow icon="location-outline" text={ev.lugar_texto}  theme={theme} />
            <InfoRow icon="calendar-outline" text={ev.fecha_evento} theme={theme} />
            <InfoRow icon="time-outline"     text={horario}         theme={theme} />

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Botones Guardar / Confirmar */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: isSaved ? theme.colors.primary : theme.colors.primary + "18",
                  borderColor: theme.colors.primary,
                }]}
                onPress={onSave}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={18}
                  color={isSaved ? "white" : theme.colors.primary}
                />
                <Text style={[styles.actionBtnText, { color: isSaved ? "white" : theme.colors.primary }]}>
                  {isSaved ? "Guardado" : "Guardar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: isConfirmed ? theme.colors.confirm : theme.colors.confirm + "18",
                  borderColor: theme.colors.confirm,
                }]}
                onPress={onConfirm}
              >
                <Ionicons
                  name={isConfirmed ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={18}
                  color={isConfirmed ? "white" : theme.colors.confirm}
                />
                <Text style={[styles.actionBtnText, { color: isConfirmed ? "white" : theme.colors.confirm }]}>
                  {isConfirmed ? "Confirmado" : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Cómo llegar */}
            <TouchableOpacity
              style={[styles.navigateBtn, { backgroundColor: theme.colors.confirm }]}
              onPress={onNavigate}
            >
              <Ionicons name="navigate" size={18} color="white" />
              <Text style={styles.navigateBtnText}>Cómo llegar</Text>
            </TouchableOpacity>

            {/* ── Sección de grupo ────────────────────────────────────────────
                Solo aparece cuando el evento está confirmado.
                Si ya hay grupo → botón "Ver grupo".
                Si no hay grupo → botón "Crear grupo".
            ─────────────────────────────────────────────────────────────────── */}
            {isConfirmed && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                {grupoId ? (
                  // Ya tiene grupo para este evento
                  <TouchableOpacity
                    style={[styles.grupoBtn, {
                      backgroundColor: theme.colors.primary + "18",
                      borderColor: theme.colors.primary,
                    }]}
                    onPress={onViewGroup}
                  >
                    <Ionicons name="people" size={18} color={theme.colors.primary} />
                    <Text style={[styles.grupoBtnText, { color: theme.colors.primary }]}>
                      Ver grupo
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // No tiene grupo todavía
                  <TouchableOpacity
                    style={[styles.grupoBtn, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }]}
                    onPress={onCreateGroup}
                  >
                    <Ionicons name="people-outline" size={18} color={theme.colors.subtext} />
                    <Text style={[styles.grupoBtnText, { color: theme.colors.subtext }]}>
                      Crear grupo para este evento
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <Text style={[styles.source, { color: theme.colors.subtle }]}>
              Fuente: {ev.origen_datos}
            </Text>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function InfoRow({
  icon, text, theme,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text?: string | null;
  theme: ReturnType<typeof useTheme>;
}) {
  if (!text) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={theme.colors.confirm} style={styles.infoIcon} />
      <Text style={[styles.infoText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content:          { paddingHorizontal: 20 },
  chipRow:          { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip:             { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipText:         { fontSize: 11, fontWeight: "600" },
  title:            { fontSize: 18, fontWeight: "bold", lineHeight: 24, marginBottom: 4 },
  status:           { fontSize: 13, fontStyle: "italic", marginBottom: 8 },
  divider:          { height: 0.5, marginVertical: 12 },
  infoRow:          { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  infoIcon:         { marginRight: 10, marginTop: 1 },
  infoText:         { flex: 1, fontSize: 14, lineHeight: 20 },
  actionRow:        { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  actionBtnText:    { fontSize: 14, fontWeight: "600" },
  navigateBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 10 },
  navigateBtnText:  { color: "white", fontSize: 15, fontWeight: "700" },
  grupoBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  grupoBtnText:     { fontSize: 14, fontWeight: "600" },
  source:           { fontSize: 11, textAlign: "center", marginTop: 16 },
});