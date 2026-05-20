// app/(tabs)/profile.tsx

import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSavedEvents } from "../context/SavedEventsContext";

export default function ProfileScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion]           = useState(true);
  const { colors, spacing, radius }         = useTheme();
  const { saved, confirmed }                = useSavedEvents();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Avatar + datos ── */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Usuario</Text>
        <Text style={[styles.email, { color: colors.subtext }]}>usuario@email.com</Text>
      </View>

      {/* ── Stats de eventos ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="help" size={20} color={colors.primary} />
          <Text style={[styles.statValor, { color: colors.text }]}>{saved.length}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Guardados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="alert" size={20} color={colors.confirm} />
          <Text style={[styles.statValor, { color: colors.text }]}>{confirmed.length}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Confirmados</Text>
        </View>
      </View>

      {/* ── Configuración ── */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Configuración</Text>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelRow}>
            <View style={[styles.settingIconBox, { backgroundColor: colors.confirm + "18" }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.confirm} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Notificaciones</Text>
          </View>
          <Switch
            value={notificaciones}
            onValueChange={setNotificaciones}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <View style={[styles.settingIconBox, { backgroundColor: colors.confirm + "18" }]}>
              <Ionicons name="location-outline" size={18} color={colors.confirm} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Usar mi ubicación</Text>
          </View>
          <Switch
            value={ubicacion}
            onValueChange={setUbicacion}
            trackColor={{ true: colors.primary }}
          />
        </View>

      </View>

      {/* ── Cerrar sesión ── */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar sesión</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, paddingTop: 60, paddingHorizontal: 16 },

  profileSection:  { alignItems: "center", marginBottom: 24, gap: 6 },
  avatar:          { width: 88, height: 88, borderRadius: 44,
                     alignItems: "center", justifyContent: "center", marginBottom: 4 },
  name:            { fontSize: 20, fontWeight: "800" },
  email:           { fontSize: 14 },

  statsRow:        { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard:        { flex: 1, alignItems: "center", gap: 4, paddingVertical: 16,
                     borderRadius: 16, elevation: 2,
                     shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6 },
  statValor:       { fontSize: 24, fontWeight: "800" },
  statLabel:       { fontSize: 12 },

  sectionTitle:    { fontSize: 12, fontWeight: "700", textTransform: "uppercase",
                     letterSpacing: 0.5, marginBottom: 10 },

  settingsCard:    { borderRadius: 16, overflow: "hidden", marginBottom: 16,
                     elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6 },
  settingRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                     paddingHorizontal: 16, paddingVertical: 14,
                     borderBottomWidth: StyleSheet.hairlineWidth },
  settingLabelRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconBox:  { width: 32, height: 32, borderRadius: 8,
                     alignItems: "center", justifyContent: "center" },
  settingLabel:    { fontSize: 15 },

  logoutBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center",
                     gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8 },
  logoutText:      { fontSize: 15, fontWeight: "700" },
});