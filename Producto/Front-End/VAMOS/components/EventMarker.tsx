// app/components/ui/EventMarker.tsx

import { Event } from "@/types/Event";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

// Los 3 estados visuales que puede tener un evento en el mapa.
export type EventStatus = "neutral" | "guardado" | "confirmado";

type Props = {
  event: Event;
  status?: EventStatus;       // default: neutral
  onPress: (event: Event) => void;
};

// Configuración por estado: color de fondo + ícono.
// Si quieres cambiar la paleta, este es el único lugar a tocar.
const STATUS_CONFIG: Record<
  EventStatus,
  { color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  neutral: {
    color: "#6B7280", // gris neutro
    icon: "location",
  },
  guardado: {
    color: "#8B5CF6", // morado
    icon: "help-outline",
  },
  confirmado: {
    color: "#F97316", // naranjo
    icon: "alert-outline",
  },
};

export function EventMarker({ event, status = "neutral", onPress }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <Marker
      coordinate={{
        latitude: event.coordenadas.latitud,
        longitude: event.coordenadas.longitud,
      }}
      onPress={() => onPress(event)}
      // Hace que la PUNTA de la colita sea lo que se ancla a la coordenada
      // exacta, no el centro del círculo.
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <View style={[styles.circle, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color="white" />
        </View>
        <View style={[styles.tail, { borderTopColor: config.color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    // sombra en iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    // sombra en Android
    elevation: 4,
  },
  // Triángulo apuntando hacia abajo, hecho con el truco clásico de borders.
  // borderTopColor se asigna dinámicamente para que combine con el círculo.
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2, // pega la colita al círculo (oculta el borde blanco que sobra)
  },
});