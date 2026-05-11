// app/(tabs)/index.tsx

import { AIChatModal } from "@/components/AIChatModal";
import { DateSelector } from "@/components/DateSelector";
import { EventDetailSheet } from "@/components/EventDetailSheet";
import { EventMarker, EventStatus } from "@/components/EventMarker";
import { useColors } from "@/hooks/use-theme-color";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/Event";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSavedEvents } from "../context/SavedEventsContext";

// ─── API Key ───────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ─── Constantes del panel de ruta deslizable ──────────────────────────────────
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_HEIGHT   = SCREEN_HEIGHT * 0.88;
const HALF_TRANSLATE = PANEL_HEIGHT - SCREEN_HEIGHT * 0.52;
const FULL_TRANSLATE = 0;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type RouteStep = {
  html_instructions: string;
  distance: { text: string };
  duration: { text: string };
};
type RouteMode = "WALKING" | "DRIVING" | "TRANSIT";
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

function iconoPaso(texto: string, esUltimo: boolean): IoniconName {
  if (esUltimo) return "location";
  const t = texto.toLowerCase();
  if (t.includes("izquierda") || t.includes("left"))  return "arrow-back";
  if (t.includes("derecha")   || t.includes("right")) return "arrow-forward";
  return "arrow-up";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MapScreen() {
  // ── Estado ────────────────────────────────────────────────────────────────
  const [coords, setCoords]               = useState({ lat: 0, lng: 0 });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [date, setDate]                   = useState(new Date());
  const [chatVisible, setChatVisible]     = useState(false);

  const [routeTarget, setRouteTarget] = useState<Event | null>(null);
  const [routeMode, setRouteMode]     = useState<RouteMode>("WALKING");
  const [routeInfo, setRouteInfo]     = useState<{ km: number; min: number } | null>(null);
  const [routeSteps, setRouteSteps]   = useState<RouteStep[]>([]);
  const [routeError, setRouteError]   = useState(false);

  // ── Panel de ruta deslizable ──────────────────────────────────────────────
  const panOffset = useRef(HALF_TRANSLATE);
  const panelY    = useRef(new Animated.Value(HALF_TRANSLATE)).current;

  const snapPanel = (to: "half" | "full") => {
    const toValue = to === "full" ? FULL_TRANSLATE : HALF_TRANSLATE;
    panOffset.current = toValue;
    Animated.spring(panelY, { toValue, useNativeDriver: false, friction: 8, tension: 65 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        panelY.setOffset(panOffset.current);
        panelY.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        const raw     = panOffset.current + gs.dy;
        const clamped = Math.max(FULL_TRANSLATE, Math.min(HALF_TRANSLATE, raw));
        panelY.setValue(clamped - panOffset.current);
      },
      onPanResponderRelease: (_, gs) => {
        panelY.flattenOffset();
        const raw     = panOffset.current + gs.dy;
        const clamped = Math.max(FULL_TRANSLATE, Math.min(HALF_TRANSLATE, raw));
        const mid     = (FULL_TRANSLATE + HALF_TRANSLATE) / 2;
        snapPanel(clamped < mid ? "full" : "half");
      },
    })
  ).current;

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { saveEvent, confirmEvent, isSaved, isConfirmed } = useSavedEvents();
  const colors = useColors();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { events, loading, error } = useEvents(coords.lat, coords.lng, date);

  // ── Funciones de ruta ─────────────────────────────────────────────────────
  const cancelarRuta = () => {
    setRouteTarget(null);
    setRouteInfo(null);
    setRouteSteps([]);
    setRouteError(false);
  };

  const iniciarRuta = (evento: Event) => {
    cancelarRuta();
    setRouteTarget(evento);
    setSelectedEvent(null);
    panOffset.current = HALF_TRANSLATE;
    panelY.setValue(HALF_TRANSLATE);
  };

  const cambiarModo = (modo: RouteMode) => {
    setRouteMode(modo);
    setRouteInfo(null);
    setRouteSteps([]);
    setRouteError(false);
  };

  // ── Guardias ──────────────────────────────────────────────────────────────
  if (!coords.lat)
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  if (error)
    return <Text style={{ padding: 20 }}>{error}</Text>;

  const origin      = { latitude: coords.lat, longitude: coords.lng };
  const destination = routeTarget
    ? { latitude: routeTarget.coordenadas.latitud, longitude: routeTarget.coordenadas.longitud }
    : null;

  const modos: { key: RouteMode; icon: IoniconName; label: string }[] = [
    { key: "WALKING", icon: "walk",  label: "Caminando"  },
    { key: "DRIVING", icon: "car",   label: "En auto"    },
    { key: "TRANSIT", icon: "bus",   label: "Transporte" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* MAPA */}
      <MapView
        style={styles.map}
        initialRegion={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
      >
        {events.map((event) => {
          const status: EventStatus = isConfirmed(event.id_externo)
            ? "confirmado"
            : isSaved(event.id_externo) ? "guardado" : "neutral";
          return (
            <EventMarker
              key={event.id_externo}
              event={event}
              status={status}
              onPress={setSelectedEvent}
            />
          );
        })}

        {destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_API_KEY}
            mode={routeMode}
            language="es"
            strokeWidth={5}
            strokeColor={colors.confirm}
            lineDashPattern={[0]}
            onReady={(result) => {
              setRouteError(false);
              setRouteInfo({ km: result.distance, min: Math.round(result.duration) });
              setRouteSteps(result.legs?.[0]?.steps ?? []);
            }}
            onError={() => { setRouteError(true); setRouteInfo(null); setRouteSteps([]); }}
          />
        )}
      </MapView>

      {/* PANEL DE RUTA DESLIZABLE */}
      {routeTarget && (
        <Animated.View
          style={[
            styles.routePanel,
            { backgroundColor: colors.card },
            { transform: [{ translateY: panelY }] },
          ]}
        >
          <View style={styles.dragHandle} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
            <View style={styles.routeHeader}>
              <Ionicons name="location" size={18} color={colors.confirm} />
              <Text style={[styles.routeEventName, { color: colors.text }]} numberOfLines={1}>
                {routeTarget.nombre_evento}
              </Text>
              <TouchableOpacity onPress={cancelarRuta} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.subtext} />
              </TouchableOpacity>
            </View>
            <View style={styles.modeTabs}>
              {modos.map((m) => {
                const activo = routeMode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.modeTab,
                      { borderColor: activo ? colors.confirm : colors.border },
                      activo && { backgroundColor: colors.confirm + "20" },
                    ]}
                    onPress={() => cambiarModo(m.key)}
                  >
                    <Ionicons name={m.icon} size={20} color={activo ? colors.confirm : colors.subtext} />
                    <Text style={[styles.modeTabLabel, { color: activo ? colors.confirm : colors.subtext }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!routeInfo && !routeError && (
            <ActivityIndicator size="small" color={colors.confirm} style={{ marginVertical: 16 }} />
          )}
          {routeError && (
            <Text style={[styles.routeErrorText, { color: colors.error ?? "#e53e3e" }]}>
              No se encontró ruta para este modo de transporte.
            </Text>
          )}

          {routeInfo && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Distancia</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {routeInfo.km.toFixed(1)}
                    <Text style={[styles.summaryUnit, { color: colors.subtext }]}> km</Text>
                  </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.confirm + "15" }]}>
                  <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Tiempo est.</Text>
                  <Text style={[styles.summaryValue, { color: colors.confirm }]}>
                    {routeInfo.min}
                    <Text style={[styles.summaryUnit, { color: colors.subtext }]}> min</Text>
                  </Text>
                </View>
              </View>

              {routeSteps.length > 0 && (
                <>
                  <Text style={[styles.stepsTitle, { color: colors.subtext }]}>Instrucciones</Text>
                  <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {routeSteps.map((step, index) => {
                      const esUltimo = index === routeSteps.length - 1;
                      const texto    = stripHtml(step.html_instructions);
                      const icono    = iconoPaso(texto, esUltimo);
                      return (
                        <View
                          key={index}
                          style={[styles.step, !esUltimo && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                        >
                          <View style={[styles.stepIconWrap, { backgroundColor: (esUltimo ? colors.primary : colors.confirm) + "20" }]}>
                            <Ionicons name={icono} size={14} color={esUltimo ? colors.primary : colors.confirm} />
                          </View>
                          <Text style={[styles.stepText, { color: colors.text }]} numberOfLines={2}>{texto}</Text>
                          {!esUltimo && (
                            <Text style={[styles.stepDist, { color: colors.subtext }]}>{step.distance.text}</Text>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* DETALLE DEL EVENTO — ya no usa Modal, no oscurece el mapa */}
      <EventDetailSheet
        event={selectedEvent}
        isSaved={selectedEvent ? isSaved(selectedEvent.id_externo) : false}
        isConfirmed={selectedEvent ? isConfirmed(selectedEvent.id_externo) : false}
        onClose={() => setSelectedEvent(null)}
        onSave={() => { if (selectedEvent) { saveEvent(selectedEvent); setSelectedEvent(null); } }}
        onConfirm={() => { if (selectedEvent) { confirmEvent(selectedEvent); setSelectedEvent(null); } }}
        onNavigate={() => { if (selectedEvent) iniciarRuta(selectedEvent); }}
      />

      {/* DateSelector y FAB — ocultos cuando hay ruta activa */}
      {!routeTarget && <DateSelector date={date} onChange={setDate} />}
      {!routeTarget && !selectedEvent && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setChatVisible(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.confirm} />
        </TouchableOpacity>
      )}

      <AIChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },
  loader:    { flex: 1 },

  routePanel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: -3 },
    paddingHorizontal: 16, paddingBottom: 30,
  },
  dragHandle:     { paddingTop: 10, paddingBottom: 4 },
  handleBar:      { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  routeHeader:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  routeEventName: { flex: 1, fontWeight: "bold", fontSize: 14 },
  modeTabs:       { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeTab:        { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 4 },
  modeTabLabel:   { fontSize: 11 },
  routeErrorText: { fontSize: 13, marginVertical: 8, paddingHorizontal: 4 },
  summaryRow:     { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryCard:    { flex: 1, borderRadius: 12, padding: 12 },
  summaryLabel:   { fontSize: 11, marginBottom: 4 },
  summaryValue:   { fontSize: 22, fontWeight: "bold" },
  summaryUnit:    { fontSize: 13, fontWeight: "normal" },
  stepsTitle:     { fontSize: 12, marginBottom: 6 },
  stepsList:      { flex: 1 },
  step:           { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  stepIconWrap:   { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepText:       { flex: 1, fontSize: 12, lineHeight: 17 },
  stepDist:       { fontSize: 11, flexShrink: 0 },

  fab: {
    position: "absolute", bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6,
  },
});