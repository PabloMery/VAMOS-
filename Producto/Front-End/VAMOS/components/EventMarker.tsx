
import { Event } from "@/types/Event";
import { Marker } from "react-native-maps";

type Props = {
  event: Event;
  onPress: (event: Event) => void; 
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