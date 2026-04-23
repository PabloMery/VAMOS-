import { useColors } from "@/hooks/useColors";
import Entypo from "@expo/vector-icons/Entypo";
import { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion] = useState(true);
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.border }]}>
          <Text style={styles.avatarText}><Entypo name="user" size={24} color="#6f00ff" /></Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Usuario</Text>
        <Text style={[styles.email, { color: colors.subtext }]}>usuario@email.com</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Configuración</Text>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}><Entypo name="bell" size={24} color="#ff7300" /> Notificaciones</Text>
        <Switch value={notificaciones} onValueChange={setNotificaciones} />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}><Entypo name="pin" size={24} color="#ff7300" /> Usar mi ubicación</Text>
        <Switch value={ubicacion} onValueChange={setUbicacion} />
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  profileSection: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { color: "gray" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabel: { fontSize: 15 },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  logoutText: { color: "white", fontWeight: "bold" },
});