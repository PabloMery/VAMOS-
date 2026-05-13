// app/grupo/[id].tsx

import { EstadoModal, ESTADOS } from "@/components/EstadoModal";
import { useGrupos } from "../context/GruposContext";
import { EstadoMiembro } from "../services/groupApi";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MOCK_USER_ID = "yo";

function formatearFecha(fecha?: string): string {
  if (!fecha) return "";
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const partes = fecha.split("-");
  const [, mes, dia] = partes[0].length === 4
    ? [partes[0], partes[1], partes[2]]
    : [partes[2], partes[1], partes[0]];
  return `${parseInt(dia)} ${meses[parseInt(mes) - 1]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GrupoScreen() {
  const { id, eventoNombre, fechaEvento } = useLocalSearchParams<{
    id: string;
    eventoNombre?: string;
    fechaEvento?:  string;
  }>();

  const { misGrupos, actualizarEstado } = useGrupos();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const grupo = misGrupos.find(g => g.id === id);

  // ── Guardia ───────────────────────────────────────────────────────────────
  if (!grupo) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="people-outline" size={48} color={colors.border} />
        <Text style={[styles.errorText, { color: colors.subtext }]}>No se encontró el grupo</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const miMiembro     = grupo.miembros.find(m => m.usuario_id === MOCK_USER_ID);
  const otrosMiembros = grupo.miembros.filter(m => m.usuario_id !== MOCK_USER_ID);
  const miEstadoCfg   = ESTADOS[miMiembro?.estado ?? "pendiente"];
  const miColor       = miEstadoCfg.color(colors);

  const compartir = async () => {
    await Share.share({
      message: `Unite a mi grupo en Vamos?!\nCódigo: ${grupo.invite_code}`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Botón volver ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Fecha del evento ── */}
        <View style={styles.fechaContainer}>
          <Ionicons name="calendar" size={28} color={colors.confirm} />
          <Text style={[styles.fechaLabel, { color: colors.confirm }]}>Fecha evento</Text>
          <Text style={[styles.fechaValor, { color: colors.primary }]}>
            {formatearFecha(fechaEvento)}
          </Text>
        </View>

        {/* ── Nombre del evento ── */}
        <Text style={[styles.eventoNombre, { color: colors.text }]} numberOfLines={2}>
          {eventoNombre}
        </Text>

        {/* ── Encabezado del grupo ── */}
        <View style={styles.grupoHeader}>
          <Text style={[styles.grupoTitulo, { color: colors.text }]}>Grupo</Text>
          <Text style={[styles.participantesCount, { color: colors.subtext }]}>
            {grupo.miembros.length} {grupo.miembros.length === 1 ? "Participante" : "Participantes"}
          </Text>
        </View>

        {/* ── Tu fila ── */}
        <View style={[styles.miFilaContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View style={styles.miInfo}>
            <Text style={[styles.miNombre, { color: colors.text }]}>
              {miMiembro?.nombre_usuario ?? "Tú"}{" "}
              <Text style={[styles.yoTag, { color: colors.subtext }]}>(Yo)</Text>
            </Text>
            <Text style={[styles.miEstadoTexto, { color: colors.text }]}>
              {miEstadoCfg.label}
            </Text>
          </View>
          <View style={[styles.iconBox, { borderColor: miColor, backgroundColor: miColor + "18" }]}>
            <Ionicons name={miEstadoCfg.icon} size={20} color={miColor} />
          </View>
          <TouchableOpacity
            style={[styles.cambiarBtn, { backgroundColor: colors.confirm }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.cambiarBtnText}>Cambiar estado</Text>
          </TouchableOpacity>
        </View>

        {/* ── Otros miembros ── */}
        {otrosMiembros.length > 0 && (
          <View style={[styles.miembrosCard, { backgroundColor: colors.card }]}>
            {otrosMiembros.map((m, index) => {
              const cfg      = ESTADOS[m.estado as EstadoMiembro] ?? ESTADOS.pendiente;
              const color    = cfg.color(colors);
              const esUltimo = index === otrosMiembros.length - 1;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.miembroFila,
                    !esUltimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                    <Ionicons name="person" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.miembroInfo}>
                    <Text style={[styles.miembroNombre, { color: colors.subtext }]}>
                      {m.nombre_usuario}
                    </Text>
                    <Text style={[styles.miembroEstadoTexto, { color: colors.text }]}>
                      {cfg.label}
                    </Text>
                  </View>
                  <View style={[styles.iconBox, { borderColor: color, backgroundColor: color + "18" }]}>
                    <Ionicons name={cfg.icon} size={20} color={color} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Compartir código ── */}
        <TouchableOpacity
          style={[styles.compartirBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
          onPress={compartir}
        >
          <Ionicons name="share-outline" size={16} color={colors.primary} />
          <Text style={[styles.compartirBtnText, { color: colors.primary }]}>
            Invitar · código {grupo.invite_code}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modal de estado ── */}
      <EstadoModal
        visible={modalVisible}
        estadoActual={miMiembro?.estado}
        onSelect={(estado) => actualizarEstado(grupo.id, estado)}
        onClose={() => setModalVisible(false)}
      />

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1 },
  centered:           { alignItems: "center", justifyContent: "center", gap: 12 },
  errorText:          { fontSize: 15 },
  backLink:           { fontSize: 15, fontWeight: "600", marginTop: 8 },
  backBtn:            { position: "absolute", top: 56, left: 16, zIndex: 10 },
  scroll:             { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 48, gap: 16 },

  fechaContainer:     { alignItems: "center", gap: 4 },
  fechaLabel:         { fontSize: 16, fontWeight: "600" },
  fechaValor:         { fontSize: 22, fontWeight: "800" },

  eventoNombre:       { fontSize: 16, fontWeight: "600", textAlign: "center" },

  grupoHeader:        { flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 8 },
  grupoTitulo:        { fontSize: 28, fontWeight: "800" },
  participantesCount: { fontSize: 16 },

  miFilaContainer:    { flexDirection: "row", alignItems: "center", gap: 10,
                        padding: 14, borderRadius: 16,
                        elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  miInfo:             { flex: 1 },
  miNombre:           { fontSize: 14, fontWeight: "600" },
  yoTag:              { fontSize: 12, fontWeight: "400" },
  miEstadoTexto:      { fontSize: 20, fontWeight: "700", marginTop: 2 },

  miembrosCard:       { borderRadius: 16, overflow: "hidden",
                        elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  miembroFila:        { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  miembroInfo:        { flex: 1 },
  miembroNombre:      { fontSize: 13 },
  miembroEstadoTexto: { fontSize: 20, fontWeight: "700", marginTop: 2 },

  compartirBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center",
                        gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  compartirBtnText:   { fontSize: 14, fontWeight: "600" },

  avatar:             { width: 44, height: 44, borderRadius: 22,
                        alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBox:            { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5,
                        alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cambiarBtn:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexShrink: 0 },
  cambiarBtnText:     { color: "white", fontSize: 12, fontWeight: "700" },
});