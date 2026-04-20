import { Marker } from "react-native-maps";
import { Event } from "../types/Event";

type Props = {
  event: Event;
  onPress: (event: Event) => void; // 👈 avisa al padre cuando se toca
};

export function EventMarker({ event, onPress }: Props) {
  return (
    <Marker
      coordinate={{
        latitude: event.coordenadas.latitud,
        longitude: event.coordenadas.longitud,
      }}
      onPress={() => onPress(event)}
    />
  );
}