// app/(tabs)/saved.tsx

import { useGrupos } from "../context/GruposContext";
import { useTheme } from "@/hooks/useTheme";
import { Event } from "@/types/Event";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSavedEvents } from "../context/SavedEventsContext";

// ─── Labels de estado de miembro en grupo ─────────────────────────────────────
const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Aún no salgo",
  en_camino: "En camino",
  llegue:    "Llegué",
  cancelado: "Cancelé",
  esperando: "Esperando fuera",
};

// ─── Navegar al mapa abriendo el evento ───────────────────────────────────────
const irAlEvento = (item: Event) => {
  router.push({
    pathname: "/",
    params: {
      openEventId: item.id_externo,
      eventDate:   item.fecha_evento,
    },
  });
};

// ─── Tarjeta: evento GUARDADO ─────────────────────────────────────────────────
type TarjetaProps = { event: Event; onRemove: () => void };

function TarjetaGuardado({ event, onRemove }: TarjetaProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>

      <View style={styles.cardHeader}>
        <View style={[styles.iconoBadge, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="help" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {event.nombre_evento}
        </Text>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={colors.subtext} />
          <Text style={[styles.detailText, { color: colors.subtext }]} numberOfLines={1}>
            {event.lugar_texto}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.subtext} />
          <Text style={[styles.detailText, { color: colors.subtext }]}>
            {event.fecha_evento}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.verBtn, { backgroundColor: colors.primary + "18" }]}
          onPress={() => irAlEvento(event)}
        >
          <Ionicons name="map-outline" size={14} color={colors.primary} />
          <Text style={[styles.verBtnText, { color: colors.primary }]}>Ver en mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={[styles.removeBtnText, { color: colors.error }]}>Quitar</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Tarjeta: evento CONFIRMADO ───────────────────────────────────────────────
type TarjetaConfirmadoProps = TarjetaProps & {
  grupoId: string | null;
  eventoNombre: string;
};

function TarjetaConfirmado({ event, onRemove, grupoId, eventoNombre }: TarjetaConfirmadoProps) {
  const { colors } = useTheme();
  const { misGrupos } = useGrupos();

  const grupo = grupoId ? misGrupos.find(g => g.id === grupoId) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: colors.confirm }]}>

      <View style={styles.cardHeader}>
        <View style={[styles.iconoBadge, { backgroundColor: colors.confirm + "18" }]}>
          <Ionicons name="alert" size={16} color={colors.confirm} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {event.nombre_evento}
        </Text>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={colors.subtext} />
          <Text style={[styles.detailText, { color: colors.subtext }]} numberOfLines={1}>
            {event.lugar_texto}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.subtext} />
          <Text style={[styles.detailText, { color: colors.subtext }]}>
            {event.fecha_evento}
          </Text>
        </View>
      </View>

      {/* ── Bloque de grupo ──────────────────────────────────────────────── */}
      <View style={[styles.grupoDivider, { borderTopColor: colors.border }]} />

      {grupo ? (
        // Tiene grupo: muestra chips de estado de miembros
        <View style={styles.grupoSection}>
          <Ionicons name="people" size={14} color={colors.confirm} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.miembrosList}>
              {grupo.miembros.map((m) => (
                <View
                  key={m.usuario_id}
                  style={[styles.estadoChip, { backgroundColor: colors.confirm + "18" }]}
                >
                  <Text style={[styles.estadoChipText, { color: colors.confirm }]}>
                    {ESTADO_LABELS[m.estado] ?? m.estado}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        // Sin grupo
        <View style={styles.grupoSection}>
          <Ionicons name="people-outline" size={14} color={colors.subtext} />
          <Text style={[styles.grupoLabel, { color: colors.subtext }]}>
            Sin grupo activo
          </Text>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={[styles.verBtn, { backgroundColor: colors.confirm + "18" }]}
            onPress={() => irAlEvento(event)}
          >
            <Ionicons name="map-outline" size={14} color={colors.confirm} />
            <Text style={[styles.verBtnText, { color: colors.confirm }]}>Ver en mapa</Text>
          </TouchableOpacity>

          {/* Botón Ver grupo — solo si tiene grupo */}
          {grupo && (
            <TouchableOpacity
              style={[styles.verBtn, { backgroundColor: colors.primary + "18" }]}
              onPress={() => router.push({
                pathname: "/grupo/[id]",
                params: { id: grupo.id, eventoNombre },
              })}
            >
              <Ionicons name="people-outline" size={14} color={colors.primary} />
              <Text style={[styles.verBtnText, { color: colors.primary }]}>Ver grupo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="close-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.removeBtnText, { color: colors.error }]}>Desconfirmar</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: "guardados" | "confirmados" }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={tab === "guardados" ? "help-outline" : "alert-outline"}
        size={48}
        color={colors.border}
      />
      <Text style={[styles.emptyText, { color: colors.subtext }]}>
        {tab === "guardados"
          ? "Todavía no guardaste ningún evento"
          : "Todavía no confirmaste ningún evento"}
      </Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SavedScreen() {
  const [tab, setTab] = useState<"guardados" | "confirmados">("guardados");

  const { saved, confirmed, removeEvent } = useSavedEvents();
  const { colors } = useTheme();
  const { getGrupoPorEvento } = useGrupos();

  const data = tab === "guardados" ? saved : confirmed;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Mis Eventos</Text>

      {/* ── Tabs ── */}
      <View style={[styles.tabRow, { backgroundColor: colors.surfaceAlt }]}>
        {(["guardados", "confirmados"] as const).map((t) => {
          const activo = tab === t;
          const color  = t === "guardados" ? colors.primary : colors.confirm;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabButton, activo && { backgroundColor: colors.card }]}
              onPress={() => setTab(t)}
            >
              <Ionicons
                name={t === "guardados" ? "help" : "alert"}
                size={15}
                color={activo ? color : colors.subtext}
              />
              <Text style={[styles.tabText, { color: activo ? color : colors.subtext }]}>
                {t === "guardados" ? "Guardados" : "Confirmados"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Lista ── */}
      {data.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id_externo}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (tab === "guardados") {
              return (
                <TarjetaGuardado
                  event={item}
                  onRemove={() => removeEvent(item.id_externo)}
                />
              );
            }
            const grupo = getGrupoPorEvento(item.id_externo);
            return (
              <TarjetaConfirmado
                event={item}
                onRemove={() => removeEvent(item.id_externo)}
                grupoId={grupo?.id ?? null}
                eventoNombre={item.nombre_evento}
              />
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title:          { fontSize: 22, fontWeight: "bold", marginBottom: 16 },

  tabRow:         { flexDirection: "row", borderRadius: 12, marginBottom: 16, padding: 4 },
  tabButton:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabText:        { fontSize: 13, fontWeight: "600" },

  list:           { paddingBottom: 32 },

  card: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader:     { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  iconoBadge:     { width: 30, height: 30, borderRadius: 15, alignItems: "center",
                    justifyContent: "center", flexShrink: 0, marginTop: 1 },
  cardTitle:      { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  cardDetails:    { gap: 5, marginBottom: 10 },
  detailRow:      { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText:     { fontSize: 13, flex: 1 },

  grupoDivider:   { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  grupoSection:   { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  grupoLabel:     { fontSize: 12, flex: 1, lineHeight: 17 },
  miembrosList:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  estadoChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  estadoChipText: { fontSize: 11, fontWeight: "600" },

  actionsRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  leftActions:    { flexDirection: "row", gap: 8 },
  verBtn:         { flexDirection: "row", alignItems: "center", gap: 5,
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  verBtnText:     { fontSize: 12, fontWeight: "600" },
  removeBtn:      { flexDirection: "row", alignItems: "center", gap: 5 },
  removeBtnText:  { fontSize: 12, fontWeight: "600" },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText:      { fontSize: 14, textAlign: "center", lineHeight: 20 },
});