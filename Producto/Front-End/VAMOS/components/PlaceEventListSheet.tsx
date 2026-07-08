import { BottomSheet } from "@/components/ui/BottomSheet";
import { useSavedEvents } from "@/context/SavedEventsContext";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Event } from "@/types/Event";

type Props = {
  eventos: Event[] | null;
  onClose: () => void;
  onSelectEvent: (event: Event) => void;
};

export function PlaceEventListSheet({ eventos, onClose, onSelectEvent }: Props) {
  const { colors } = useTheme();
  const { isSaved, isConfirmed } = useSavedEvents();

  const lugar = eventos?.[0]?.lugar_texto ?? "";

  return (
    <BottomSheet visible={eventos !== null} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {eventos?.length ?? 0} eventos en este lugar
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]} numberOfLines={1}>
          {lugar}
        </Text>
      </View>

      <FlatList
        data={eventos ?? []}
        keyExtractor={(e) => e.id_externo}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const confirmed = isConfirmed(item.id_externo);
          const saved = isSaved(item.id_externo);
          const accent = confirmed ? colors.confirm : saved ? colors.primary : colors.border;
          const icon = confirmed ? "alert" : saved ? "help" : "location-outline";
          const hora = item.horario_variable
            ? "Horario variable"
            : item.hora_inicio
              ? `${item.hora_inicio}${item.hora_fin ? " – " + item.hora_fin : ""}`
              : "Sin horario";

          return (
            <TouchableOpacity
              style={[styles.card, { borderColor: accent, backgroundColor: colors.card }]}
              onPress={() => onSelectEvent(item)}
            >
              <View style={[styles.iconBox, { backgroundColor: accent + "20" }]}>
                <Ionicons name={icon} size={18} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
                  {item.nombre_evento}
                </Text>
                <Text style={[styles.eventMeta, { color: colors.subtext }]}>{hora}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
            </TouchableOpacity>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  eventName: { fontSize: 14, fontWeight: "600" },
  eventMeta: { fontSize: 12, marginTop: 2 },
});