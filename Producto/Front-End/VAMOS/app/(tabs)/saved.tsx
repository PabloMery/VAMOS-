// app/(tabs)/saved.tsx

import { useGrupos } from "../context/GruposContext";
import { useTheme } from "@/hooks/useTheme";
import { Event } from "@/types/Event";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSavedEvents } from "../context/SavedEventsContext";

// ─── Formatear fecha (igual que en grupo/[id].tsx) ────────────────────────────
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

// ─── Navegar al mapa abriendo el evento ───────────────────────────────────────
const irAlEvento = (item: Event) => {
  router.push({
    pathname: "/",
    params: { openEventId: item.id_externo, eventDate: item.fecha_evento, t: Date.now().toString(), },
  });
};

// ─── Tarjeta: evento GUARDADO ─────────────────────────────────────────────────
type TarjetaProps = { event: Event; onRemove: () => void };

function TarjetaGuardado({ event, onRemove }: TarjetaProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>

      {/* Banda superior: tipo + fecha */}
      <View style={[styles.cardBanda, { backgroundColor: colors.primary + "15" }]}>
        <View style={styles.bandaTipo}>
          <Ionicons name="help" size={12} color={colors.primary} />
          <Text style={[styles.bandaTipoText, { color: colors.primary }]}>GUARDADO</Text>
        </View>
        <Text style={[styles.bandaFecha, { color: colors.primary }]}>
          {formatearFecha(event.fecha_evento)}
        </Text>
      </View>

      {/* Cuerpo */}
      <View style={styles.cardBody}>
        <Text style={[styles.eventNombre, { color: colors.text }]} numberOfLines={2}>
          {event.nombre_evento}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.subtext} />
          <Text style={[styles.locationText, { color: colors.subtext }]} numberOfLines={1}>
            {event.lugar_texto}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.pillBtn, { backgroundColor: colors.primary + "18" }]}
          onPress={() => irAlEvento(event)}
        >
          <Ionicons name="map-outline" size={14} color={colors.primary} />
          <Text style={[styles.pillBtnText, { color: colors.primary }]}>Ver en mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pillBtn, { backgroundColor: colors.error + "12" }]}
          onPress={onRemove}
        >
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={[styles.pillBtnText, { color: colors.error }]}>Quitar</Text>
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
    <View style={[styles.card, { backgroundColor: colors.card }]}>

      {/* Banda superior: tipo + fecha */}
      <View style={[styles.cardBanda, { backgroundColor: colors.confirm + "15" }]}>
        <View style={styles.bandaTipo}>
          <Ionicons name="alert" size={12} color={colors.confirm} />
          <Text style={[styles.bandaTipoText, { color: colors.confirm }]}>CONFIRMADO</Text>
        </View>
        <Text style={[styles.bandaFecha, { color: colors.confirm }]}>
          {formatearFecha(event.fecha_evento)}
        </Text>
      </View>

      {/* Cuerpo */}
      <View style={styles.cardBody}>
        <Text style={[styles.eventNombre, { color: colors.text }]} numberOfLines={2}>
          {event.nombre_evento}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.subtext} />
          <Text style={[styles.locationText, { color: colors.subtext }]} numberOfLines={1}>
            {event.lugar_texto}
          </Text>
        </View>

        {/* Bloque grupo */}
        {grupo ? (
          <TouchableOpacity
            style={[styles.grupoBandaActivo, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
            onPress={() => router.push({
              pathname: "/grupo/[id]",
              params: { id: grupo.id, eventoNombre, fechaEvento: event.fecha_evento },
            })}
          >
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={[styles.grupoActivoText, { color: colors.primary }]}>
              Grupo · {grupo.miembros.length} {grupo.miembros.length === 1 ? "persona" : "personas"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.grupoBandaVacia, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="people-outline" size={14} color={colors.subtext} />
            <Text style={[styles.grupoVacioText, { color: colors.subtext }]}>Sin grupo activo</Text>
          </View>
        )}
      </View>

      {/* Acciones */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.pillBtn, { backgroundColor: colors.confirm + "18" }]}
          onPress={() => irAlEvento(event)}
        >
          <Ionicons name="map-outline" size={14} color={colors.confirm} />
          <Text style={[styles.pillBtnText, { color: colors.confirm }]}>Ver en mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pillBtn, { backgroundColor: colors.error + "12" }]}
          onPress={onRemove}
        >
          <Ionicons name="close-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.pillBtnText, { color: colors.error }]}>Desconfirmar</Text>
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
  container:        { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title:            { fontSize: 22, fontWeight: "800", marginBottom: 16 },

  tabRow:           { flexDirection: "row", borderRadius: 12, marginBottom: 16, padding: 4 },
  tabButton:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabText:          { fontSize: 13, fontWeight: "600" },

  list:             { paddingBottom: 32 },

  // Card
  card:             { borderRadius: 16, marginBottom: 12, overflow: "hidden",
                      elevation: 3, shadowColor: "#000", shadowOpacity: 0.08,
                      shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },

  // Banda superior
  cardBanda:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      paddingHorizontal: 14, paddingVertical: 10 },
  bandaTipo:        { flexDirection: "row", alignItems: "center", gap: 5 },
  bandaTipoText:    { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  bandaFecha:       { fontSize: 13, fontWeight: "700" },

  // Cuerpo
  cardBody:         { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, gap: 8 },
  eventNombre:      { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  locationRow:      { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText:     { fontSize: 13, flex: 1 },

  // Grupo
  grupoBandaActivo: { flexDirection: "row", alignItems: "center", gap: 8,
                      paddingHorizontal: 12, paddingVertical: 8,
                      borderRadius: 10, borderWidth: 1, marginTop: 4 },
  grupoActivoText:  { flex: 1, fontSize: 13, fontWeight: "600" },
  grupoBandaVacia:  { flexDirection: "row", alignItems: "center", gap: 8,
                      paddingHorizontal: 12, paddingVertical: 8,
                      borderRadius: 10, marginTop: 4 },
  grupoVacioText:   { fontSize: 13 },

  // Footer
  cardFooter:       { flexDirection: "row", gap: 8, padding: 12,
                      borderTopWidth: StyleSheet.hairlineWidth },
  pillBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 6, paddingVertical: 9, borderRadius: 20 },
  pillBtnText:      { fontSize: 13, fontWeight: "600" },

  // Empty
  emptyContainer:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText:        { fontSize: 14, textAlign: "center", lineHeight: 20 },
});