// app/(tabs)/index.tsx

import { AIChatModal } from "@/components/AIChatModal";
import { DateSelector } from "@/components/DateSelector";
import { EventDetailSheet } from "@/components/EventDetailSheet";
import { EventMarker, EventStatus } from "@/components/EventMarker";
import { RouteMode, RoutePanel, RouteStep } from "@/components/RoutePanel";
import { useGrupos } from "../context/GruposContext";
import { useTheme } from "@/hooks/useTheme";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/Event";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

  // ── Botón de centrar personalizado ────────────────────────────────────────
  const mapRef = useRef<MapView>(null);
  const centrarMapa = () => {
    mapRef.current?.animateToRegion(
      { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      400
    );
  };

  // Función helper para abrir un evento y centrar el mapa
  const abrirEventoEnMapa = (evento: Event) => {
    setSelectedEvent(evento);
    mapRef.current?.animateToRegion({
      latitude:      evento.coordenadas.latitud,
      longitude:     evento.coordenadas.longitud,
      latitudeDelta:  0.01,  // zoom más cercano que el inicial
      longitudeDelta: 0.01,
    }, 600); // 600ms de animación
  };

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { saveEvent, confirmEvent, isSaved, isConfirmed } = useSavedEvents();
  const { colors } = useTheme();
  const { getGrupoPorEvento, crearGrupo } = useGrupos();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { events, loading, error } = useEvents(coords.lat, coords.lng, date);

  // ── Navegación desde saved.tsx ────────────────────────────────────────────
  const pendingEventId = useRef<string | null>(null);

  const { openEventId, eventDate, t} = useLocalSearchParams<{
    openEventId?: string;
    eventDate?: string;
    t?:           string;
  }>();

  // 1. Cuando llegan los params: ajusta la fecha y marca el evento pendiente
  // 1. Cuando llegan los params
  useEffect(() => {
    if (!openEventId || !eventDate) return;
    pendingEventId.current = openEventId;

    const partes = eventDate.split("-");
    const fechaParsed = partes[0].length === 4
      ? new Date(eventDate)
      : new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
    if (!isNaN(fechaParsed.getTime())) setDate(fechaParsed);

    // Si los eventos ya están cargados con esa fecha, buscar de una vez
    const evento = events.find(e => e.id_externo === openEventId);
    if (evento) {
      abrirEventoEnMapa(evento);
      pendingEventId.current = null;
    }
  }, [openEventId, eventDate, t]);

  // 2. Cuando los eventos cargan
  useEffect(() => {
    if (!pendingEventId.current || events.length === 0) return;
    const evento = events.find(e => e.id_externo === pendingEventId.current);
    if (evento) {
      abrirEventoEnMapa(evento);
      pendingEventId.current = null;
    }
  }, [events]);

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
  };

  const cambiarModo = (modo: RouteMode) => {
    setRouteMode(modo);
    setRouteInfo(null);
    setRouteSteps([]);
    setRouteError(false);
  };

  // ── Grupo del evento seleccionado ─────────────────────────────────────────
  const grupoDelEvento = selectedEvent
    ? getGrupoPorEvento(selectedEvent.id_externo)
    : null;

  // ── Guardias ──────────────────────────────────────────────────────────────
  if (!coords.lat)
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  if (error)
    return <Text style={{ padding: 20 }}>{error}</Text>;

  const origin      = { latitude: coords.lat, longitude: coords.lng };
  const destination = routeTarget
    ? { latitude: routeTarget.coordenadas.latitud, longitude: routeTarget.coordenadas.longitud }
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* MAPA */}
      <MapView
        ref={mapRef}
        toolbarEnabled={false}
        showsMyLocationButton={false}
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

      {/* PANEL DE RUTA */}
      <RoutePanel
        event={routeTarget}
        routeMode={routeMode}
        routeInfo={routeInfo}
        routeSteps={routeSteps}
        routeError={routeError}
        onClose={cancelarRuta}
        onModeChange={cambiarModo}
      />

      {/* DETALLE DEL EVENTO */}
      <EventDetailSheet
        event={selectedEvent}
        isSaved={selectedEvent ? isSaved(selectedEvent.id_externo) : false}
        isConfirmed={selectedEvent ? isConfirmed(selectedEvent.id_externo) : false}
        grupoId={grupoDelEvento?.id ?? null}
        onClose={() => setSelectedEvent(null)}
        onSave={() => { if (selectedEvent) { saveEvent(selectedEvent); setSelectedEvent(null); } }}
        onConfirm={() => { if (selectedEvent) { confirmEvent(selectedEvent); setSelectedEvent(null); } }}
        onNavigate={() => { if (selectedEvent) iniciarRuta(selectedEvent); }}
        onCreateGroup={async () => {
          if (!selectedEvent) return;
          await crearGrupo(selectedEvent.id_externo);
          // El sheet se actualiza solo porque grupoDelEvento viene del contexto reactivo
        }}
        onViewGroup={() => {
          if (!grupoDelEvento || !selectedEvent) return;
          const nombre = selectedEvent.nombre_evento;
          const fecha  = selectedEvent.fecha_evento;
          setSelectedEvent(null);
          router.push({
            pathname: "/grupo/[id]",
            params: { id: grupoDelEvento.id, eventoNombre: nombre, fechaEvento: fecha },
          });
        }}
      />

      {/* DateSelector y FABs */}
      {!routeTarget && !selectedEvent && !chatVisible && (
        <DateSelector date={date} onChange={setDate} />
      )}
      {!routeTarget && !selectedEvent && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setChatVisible(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.confirm} />
        </TouchableOpacity>
      )}
      {!routeTarget && !selectedEvent && (
        <TouchableOpacity
          style={[styles.fabCentrar, { backgroundColor: colors.card }]}
          onPress={centrarMapa}
        >
          <Ionicons name="navigate" size={22} color={colors.confirm} />
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
  fab: {
    position: "absolute", bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabCentrar: {
    position: "absolute", bottom: 170, right: 20,
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6,
  },
});