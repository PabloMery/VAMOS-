import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Modal,
  TouchableOpacity,
} from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { Event } from "@/types/Event";
import { useEvents } from "@/hooks/useEvents";
import { EventMarker } from "@/components/EventMarker";


export default function MapScreen() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { events, loading, error } = useEvents(coords.lat, coords.lng);

  if (!coords.lat) return <ActivityIndicator style={styles.loader} size="large" />;
  if (error) return <Text style={{ padding: 20 }}>❌ {error}</Text>;

  const horario = selectedEvent
    ? selectedEvent.horario_variable
      ? "Horario variable"
      : selectedEvent.hora_inicio
      ? `${selectedEvent.hora_inicio} - ${selectedEvent.hora_fin ?? "?"}`
      : "Sin horario"
    : "";

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
      >
        {events.map((event) => (
          <EventMarker
            key={event.id_externo}
            event={event}
            onPress={setSelectedEvent} //  guarda el evento tocado
          />
        ))}
      </MapView>

      {/* Modal FUERA del MapView */}
      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setSelectedEvent(null)}
        >
          <TouchableOpacity style={styles.card} activeOpacity={1}>
            <Text style={styles.title}>{selectedEvent?.nombre_evento}</Text>
            <Text> {selectedEvent?.lugar_texto}</Text>
            <Text> {selectedEvent?.fecha_evento}</Text>
            <Text> {horario}</Text>
            <Text> {selectedEvent?.categoria}</Text>

            {selectedEvent && (
              <>
                {selectedEvent.precio === null && <Text>Sin info de precio</Text>}
                {selectedEvent.precio === 0 && <Text>Gratis</Text>}
                {selectedEvent.precio !== null && selectedEvent.precio > 0 && (
                  <Text> ${selectedEvent.precio}</Text>
                )}
              </>
            )}

            <Text>
               {selectedEvent?.requiere_inscripcion ? "Requiere inscripción" : "Sin inscripción"}
            </Text>
            <Text style={styles.estado}>{selectedEvent?.estado_evento}</Text>
            <Text style={styles.origen}>Fuente: {selectedEvent?.origen_datos}</Text>

            <TouchableOpacity
              style={styles.botonCerrar}
              onPress={() => setSelectedEvent(null)}
            >
              <Text style={styles.botonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 6,
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  estado: { marginTop: 4, color: "gray", fontStyle: "italic" },
  origen: { fontSize: 11, color: "#aaa" },
  botonCerrar: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  botonTexto: { color: "white", fontWeight: "bold" },
});