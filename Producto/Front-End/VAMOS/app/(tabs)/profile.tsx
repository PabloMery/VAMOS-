// app/(tabs)/profile.tsx

import { useAuth } from "@/context/AuthContext";
import { useSavedEvents } from "@/context/SavedEventsContext";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const { usuario, estaLogueado, cerrarSesion } = useAuth();
  const { saved, confirmed } = useSavedEvents();
  const router = useRouter();

  const [notificaciones, setNotificaciones] = useState(true);
  const [ubicacion, setUbicacion] = useState(true);

  function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await cerrarSesion();
            // Navegar a index.tsx que se encarga de redirigir al login
            router.replace("/");
          },
        },
      ]
    );
  }

  // Obtener iniciales para el avatar fallback
  const iniciales = usuario
    ? `${usuario.nombre?.[0] ?? ""}${usuario.apellido?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Header con avatar + datos ── */}
      <View style={styles.profileSection}>
        {usuario?.avatar_url ? (
          <Image
            source={{ uri: usuario.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {iniciales}
            </Text>
          </View>
        )}

        <Text style={[styles.name, { color: colors.text }]}>
          {estaLogueado && usuario
            ? `${usuario.nombre} ${usuario.apellido}`.trim() || "Usuario"
            : "Invitado"}
        </Text>

        <Text style={[styles.email, { color: colors.subtext }]}>
          {estaLogueado && usuario ? usuario.email : "Sin cuenta vinculada"}
        </Text>

        {!estaLogueado && (
          <TouchableOpacity
            style={[styles.loginHint, { backgroundColor: colors.primary + "15" }]}
            onPress={() => router.push("/login")}
          >
            <Ionicons name="log-in-outline" size={16} color={colors.primary} />
            <Text style={[styles.loginHintText, { color: colors.primary }]}>
              Inicia sesión para guardar tus datos
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Stats de eventos ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconBox, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="help" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statValor, { color: colors.text }]}>{saved.length}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Guardados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconBox, { backgroundColor: colors.confirm + "18" }]}>
            <Ionicons name="alert" size={18} color={colors.confirm} />
          </View>
          <Text style={[styles.statValor, { color: colors.text }]}>{confirmed.length}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Confirmados</Text>
        </View>
      </View>

      {/* ── Configuración ── */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
        Configuración
      </Text>

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

      {/* ── Cerrar sesión (solo si logueado) ── */}
      {estaLogueado && (
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.error + "15", borderColor: colors.error + "40" },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      )}

      {/* ── Versión ── */}
      <Text style={[styles.version, { color: colors.subtle }]}>Vamos?! v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 },

  profileSection: { alignItems: "center", marginBottom: 24, gap: 6 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  avatarImage: {
    width: 88, height: 88, borderRadius: 44, marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800" },
  email: { fontSize: 14 },

  loginHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8,
  },
  loginHintText: { fontSize: 13, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 16,
    borderRadius: 16, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  statIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  statValor: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12 },

  sectionTitle: {
    fontSize: 12, fontWeight: "700", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 10,
  },

  settingsCard: {
    borderRadius: 16, overflow: "hidden", marginBottom: 16,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabelRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconBox: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  settingLabel: { fontSize: 15 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },

  version: { textAlign: "center", fontSize: 11, marginTop: 24 },
});