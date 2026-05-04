import { useColors } from "@/hooks/useColors";
import Entypo from "@expo/vector-icons/Entypo";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSavedEvents } from "../context/SavedEventsContext";
export default function SavedScreen() {
  const [tab, setTab] = useState<"guardados" | "confirmados">("guardados");
  const { saved, confirmed, removeEvent } = useSavedEvents(); 
  const colors = useColors();
  const data = tab === "guardados" ? saved : confirmed; 

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Mis Eventos</Text>

      <View style={[styles.tabRow, { backgroundColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "guardados" && { backgroundColor: colors.card }]}
          onPress={() => setTab("guardados")}
        >
          <Text style={[styles.tabText, tab === "guardados" && { color: colors.purple }]}>
            Guardados
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "confirmados" && { backgroundColor: colors.card }]}
          onPress={() => setTab("confirmados")}
        >
          <Text style={[styles.tabText, tab === "confirmados" && { color: colors.orange }]}>
            Confirmados
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <Text style={[styles.empty, { color: colors.subtext }]}>
          {tab === "guardados" ? "No tienes eventos guardados" : "No tienes eventos confirmados"}
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id_externo}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.nombre_evento}</Text>
              <Text style={{ color: colors.text }}><Entypo name="pin" size={24} color="#ff7300" /> {item.lugar_texto}</Text>
              <Text style={{ color: colors.text }}><Entypo name="calendar" size={24} color="#ff7300" /> {item.fecha_evento}</Text>
              <TouchableOpacity onPress={() => removeEvent(item.id_externo)}>
                <Text style={[styles.eliminar, { color: colors.danger }]}><Entypo name="trash" size={24} color="#ff7300" /> Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: { backgroundColor: "white", elevation: 2 },
  tabText: { color: "gray", fontWeight: "600" },
  tabTextActive: { color: "#007AFF" },
  empty: { textAlign: "center", color: "gray", marginTop: 40 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    gap: 4,
  },
  cardTitle: { fontWeight: "bold", fontSize: 15 },
  eliminar: { color: "#FF3B30", marginTop: 6 },
});