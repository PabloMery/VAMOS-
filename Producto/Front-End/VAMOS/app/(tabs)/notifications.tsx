// app/(tabs)/notifications.tsx

import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

export default function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Notificaciones</Text>

      {/* Empty state — igual que en saved.tsx */}
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Todo tranquilo por acá</Text>
        <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
          Cuando haya novedades de tus eventos o grupos las verás acá
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title:          { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  emptyTitle:     { fontSize: 17, fontWeight: "700" },
  emptySubtext:   { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 },
});