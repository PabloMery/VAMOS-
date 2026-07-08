import { Event } from "@/types/Event";
import { Marker } from "react-native-maps";
import { memo } from "react";

export type EventStatus = "neutral" | "guardado" | "confirmado";

type Props = {
  event: Event;
  status?: EventStatus;
  count?: number;
  onPress: () => void;
};

// Mapa de imágenes: para cada estado, guardamos el pin normal y los variantes con badge
const PIN_IMAGES: Record<EventStatus, {
  normal: any;
  badge2: any;
  badge3: any;
  badgePlus: any;
}> = {
  neutral: {
    normal:    require("@/assets/pins/pin_neutral.png"),
    badge2:    require("@/assets/pins/pin_neutral_badge_2.png"),
    badge3:    require("@/assets/pins/pin_neutral_badge_3.png"),
    badgePlus: require("@/assets/pins/pin_neutral_badge_plus.png"),
  },
  guardado: {
    normal:    require("@/assets/pins/pin_guardado.png"),
    badge2:    require("@/assets/pins/pin_guardado_badge_2.png"),
    badge3:    require("@/assets/pins/pin_guardado_badge_3.png"),
    badgePlus: require("@/assets/pins/pin_guardado_badge_plus.png"),
  },
  confirmado: {
    normal:    require("@/assets/pins/pin_confirmado.png"),
    badge2:    require("@/assets/pins/pin_confirmado_badge_2.png"),
    badge3:    require("@/assets/pins/pin_confirmado_badge_3.png"),
    badgePlus: require("@/assets/pins/pin_confirmado_badge_plus.png"),
  },
};

// Elige la imagen correcta según cuántos eventos hay
function elegirImagen(status: EventStatus, count: number) {
  const set = PIN_IMAGES[status];
  if (count <= 1) return set.normal;
  if (count === 2) return set.badge2;
  if (count === 3) return set.badge3;
  return set.badgePlus; // 4 o más
}

export const EventMarker = memo(function EventMarker({
  event, status = "neutral", count = 1, onPress,
}: Props) {
  const source = elegirImagen(status, count);

  return (
    <Marker
      coordinate={{ latitude: event.coordenadas.latitud, longitude: event.coordenadas.longitud }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      image={source}
    />
  );
}, (prev, next) =>
  prev.event.id_externo === next.event.id_externo &&
  prev.status === next.status &&
  prev.count === next.count
);