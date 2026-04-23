import { useColors } from "@/hooks/useColors";
import Entypo from "@expo/vector-icons/Entypo";
import { StyleSheet, Text, View } from "react-native";

export default function NotificationsScreen() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}><Entypo name="bell" size={24} color="#ff7300" /> Notificaciones</Text>
      <Text style={[styles.empty, { color: colors.subtext }]}>
        No tienes notificaciones aún
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  empty: { },
});