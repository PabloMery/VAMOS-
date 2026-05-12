// app/grupo/[id].tsx

import { useGrupos } from "../context/GruposContext";
import { EstadoMiembro } from "../services/groupApi";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Share, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Configuración de estados ─────────────────────────────────────────────────
type EstadoConfig = {
  label:  string;
  icon:   React.ComponentProps<typeof Ionicons>["name"];
  color:  (c: ReturnType<typeof useTheme>["colors"]) => string;
};

const ESTADOS: Record<EstadoMiembro, EstadoConfig> = {
  pendiente:  { label: "Aún no salgo", icon: "time-outline",             color: c => c.subtext  },
  en_camino:  { label: "En camino",    icon: "walk-outline",             color: c => c.info     },
  llegue:     { label: "Llegué",       icon: "checkmark-circle-outline", color: c => c.success  },
  cancelado:  { label: "Cancelé",      icon: "close-circle-outline",     color: c => c.error    },
  esperando:  { label: "Esperando",    icon: "hourglass-outline",        color: c => c.warning  },
};

// Mock user id — igual que en GruposContext
const MOCK_USER_ID = "yo";

// ─────────────────────────────────────────────────────────────────────────────
export default function GrupoScreen() {
  const { id, eventoNombre } = useLocalSearchParams<{ id: string; eventoNombre?: string }>();
  const { misGrupos, actualizarEstado } = useGrupos();
  const { colors, spacing, radius } = useTheme();

  const grupo = misGrupos.find(g => g.id === id);

  // ── Compartir link de invitación ──────────────────────────────────────────
  const compartir = async () => {
    if (!grupo) return;
    // TODO Fase 3: reemplazar con Linking.createURL(`grupo/${grupo.invite_code}`)
    // cuando el deep link esté configurado en app.json
    await Share.share({
      message: `Unite a mi grupo en Vamos?!\nCódigo de invitación: ${grupo.invite_code}`,
    });
  };

  // ── Guardia: grupo no encontrado ──────────────────────────────────────────
  if (!grupo) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="people-outline" size={48} color={colors.border} />
        <Text style={[styles.errorText, { color: colors.subtext }]}>
          No se encontró el grupo
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const miMiembro = grupo.miembros.find(m => m.usuario_id === MOCK_USER_ID);
  const otrosMiembros = grupo.miembros.filter(m => m.usuario_id !== MOCK_USER_ID);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Cabecera ── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {eventoNombre ?? "Grupo"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.subtext }]}>
            {grupo.miembros.length} {grupo.miembros.length === 1 ? "persona" : "personas"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary + "18" }]}
          onPress={compartir}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Tu estado ── */}
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Tu estado</Text>
        <View style={styles.estadosGrid}>
          {(Object.entries(ESTADOS) as [EstadoMiembro, EstadoConfig][]).map(([key, cfg]) => {
            const activo = miMiembro?.estado === key;
            const color  = cfg.color(colors);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.estadoChip,
                  { borderColor: activo ? color : colors.border },
                  activo && { backgroundColor: color + "20" },
                ]}
                onPress={() => actualizarEstado(grupo.id, key)}
              >
                <Ionicons name={cfg.icon} size={16} color={activo ? color : colors.subtext} />
                <Text style={[styles.estadoChipText, { color: activo ? color : colors.subtext }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Otros miembros ── */}
        {otrosMiembros.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.subtext, marginTop: spacing.lg }]}>
              Grupo
            </Text>
            <View style={[styles.miembrosCard, { backgroundColor: colors.card }]}>
              {otrosMiembros.map((m, index) => {
                const cfg   = ESTADOS[m.estado as EstadoMiembro] ?? ESTADOS.pendiente;
                const color = cfg.color(colors);
                const esUltimo = index === otrosMiembros.length - 1;
                return (
                  <View
                    key={m.usuario_id}
                    style={[
                      styles.miembroRow,
                      !esUltimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                  >
                    {/* Avatar placeholder */}
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="person" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.miembroNombre, { color: colors.text }]}>
                      {m.usuario_id === "otro_usuario" ? "Otro usuario" : m.usuario_id}
                    </Text>
                    <View style={[styles.estadoBadge, { backgroundColor: color + "20" }]}>
                      <Ionicons name={cfg.icon} size={12} color={color} />
                      <Text style={[styles.estadoBadgeText, { color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Código de invitación ── */}
        <Text style={[styles.sectionTitle, { color: colors.subtext, marginTop: spacing.lg }]}>
          Invitar
        </Text>
        <View style={[styles.codigoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.codigoLabel, { color: colors.subtext }]}>Código de invitación</Text>
            <Text style={[styles.codigoValor, { color: colors.primary }]}>{grupo.invite_code}</Text>
          </View>
          <TouchableOpacity
            style={[styles.compartirBtn, { backgroundColor: colors.primary }]}
            onPress={compartir}
          >
            <Ionicons name="share-outline" size={16} color="white" />
            <Text style={styles.compartirBtnText}>Compartir</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1 },
  centered:         { alignItems: "center", justifyContent: "center", gap: 12 },
  errorText:        { fontSize: 15 },
  backLink:         { fontSize: 15, fontWeight: "600", marginTop: 8 },

  header:           { flexDirection: "row", alignItems: "center", gap: 12,
                      paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
                      borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle:      { fontSize: 16, fontWeight: "700" },
  headerSub:        { fontSize: 12, marginTop: 2 },
  shareBtn:         { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  scroll:           { padding: 16, paddingBottom: 48 },
  sectionTitle:     { fontSize: 12, fontWeight: "600", textTransform: "uppercase",
                      letterSpacing: 0.5, marginBottom: 10 },

  estadosGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  estadoChip:       { flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 12, paddingVertical: 8,
                      borderRadius: 20, borderWidth: 1.5 },
  estadoChipText:   { fontSize: 13, fontWeight: "600" },

  miembrosCard:     { borderRadius: 14, overflow: "hidden",
                      elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  miembroRow:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  avatar:           { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  miembroNombre:    { flex: 1, fontSize: 14, fontWeight: "500" },
  estadoBadge:      { flexDirection: "row", alignItems: "center", gap: 4,
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  estadoBadgeText:  { fontSize: 11, fontWeight: "600" },

  codigoCard:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      padding: 16, borderRadius: 14, borderWidth: 1 },
  codigoLabel:      { fontSize: 11, marginBottom: 4 },
  codigoValor:      { fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  compartirBtn:     { flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  compartirBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
});