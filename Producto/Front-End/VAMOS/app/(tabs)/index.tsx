import { AIChatModal } from "@/components/AIChatModal";
import { DateSelector } from "@/components/DateSelector";
import { EventMarker } from "@/components/EventMarker";
import { useColors } from "@/hooks/useColors";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/Event";
import Entypo from "@expo/vector-icons/Entypo";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { useSavedEvents } from "../context/SavedEventsContext";

export default function MapScreen() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [date, setDate] = useState(new Date());
  const { saveEvent, confirmEvent } = useSavedEvents();
  const colors = useColors();
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { events, loading, error } = useEvents(coords.lat, coords.lng, date);

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
<TouchableOpacity style={styles.overlay} onPress={() => setSelectedEvent(null)}>
  <TouchableOpacity
    style={[styles.card, { backgroundColor: colors.card }]} 
    activeOpacity={1}
  >
    <Text style={[styles.title, { color: colors.text }]}>{selectedEvent?.nombre_evento}</Text>
    <Text style={{ color: colors.text }}><Entypo name="pin" size={24} color="#ff7300" /> {selectedEvent?.lugar_texto}</Text>
    <Text style={{ color: colors.text }}><Entypo name="calendar" size={24} color="#ff7300" /> {selectedEvent?.fecha_evento}</Text>
    <Text style={{ color: colors.text }}><Entypo name="clock" size={24} color="#ff7300" /> {horario}</Text>
    <Text style={{ color: colors.text }}><Entypo name="ticket" size={24} color="#ff7300" /> {selectedEvent?.categoria}</Text>

    {selectedEvent && (
      <>
        {selectedEvent.precio === null && <Text style={{ color: colors.text }}><Entypo name="wallet" size={24} color="#8c00ff" /> Sin info de precio</Text>}
        {selectedEvent.precio === 0 && <Text style={{ color: colors.text }}><Entypo name="wallet" size={24} color="#8c00ff" /> Gratis</Text>}
        {selectedEvent.precio !== null && selectedEvent.precio > 0 && (
          <Text style={{ color: colors.text }}><Entypo name="wallet" size={24} color="#8c00ff" /> ${selectedEvent.precio}</Text>
        )}
      </>
    )}

    <Text style={{ color: colors.text }}>
      <Entypo name="list" size={24} color="#ff7300" /> {selectedEvent?.requiere_inscripcion ? "Requiere inscripción" : "Sin inscripción"}
    </Text>
    <Text style={[styles.estado, { color: colors.subtext }]}>{selectedEvent?.estado_evento}</Text>
    <Text style={[styles.origen, { color: colors.subtle }]}>Fuente: {selectedEvent?.origen_datos}</Text>

    <View style={styles.actionRow}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.save }]}
        onPress={() => { if (selectedEvent) saveEvent(selectedEvent); setSelectedEvent(null); }}
      >
        <Text style={styles.actionText}>Guardar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.confirm }]}
        onPress={() => { if (selectedEvent) confirmEvent(selectedEvent); setSelectedEvent(null); }}
      >
        <Text style={styles.actionText}>Confirmar</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.botonCerrar, { backgroundColor: colors.primary }]}
      onPress={() => setSelectedEvent(null)}
    >
      <Text style={styles.botonTexto}>Cerrar</Text>
    </TouchableOpacity>
  </TouchableOpacity>
</TouchableOpacity>
      </Modal>
      <DateSelector date={date} onChange={setDate} />
      
          {/* Botón flotante */}
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.purple }]}
      onPress={() => setChatVisible(true)}
    >
      <Text style={styles.fabText}><Entypo name="chat" size={24} color="#ff7300" /></Text>
    </TouchableOpacity>

    {/* Modal del chat */}
    <AIChatModal
      visible={chatVisible}
      onClose={() => setChatVisible(false)}
    />
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

  actionRow: {
  flexDirection: "row",
  gap: 8,
  marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  saveButton: { backgroundColor: "#FF9500" },
  confirmButton: { backgroundColor: "#34C759" },
  actionText: { color: "white", fontWeight: "bold" },
  /*Boton de chat*/ 
  fab: {
  position: "absolute",
  bottom: 100,
  right: 20,
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
  elevation: 6,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 6,
},
fabText: { fontSize: 24 },
});