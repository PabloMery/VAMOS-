// app/components/EventRoute.tsx
//
// Dibuja la ruta desde la ubicación actual del usuario hasta un evento.
// Se coloca DENTRO de tu <MapView> existente en index.tsx.
//
// Uso:
//   <EventRoute evento={eventoSeleccionado} />
//
// Solo se renderiza cuando hay un evento seleccionado. Si no hay GPS
// o no hay ruta, muestra un mensaje al usuario.

import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapViewDirections from "react-native-maps-directions";

import { useUserLocation } from "@/hooks/useUserLocation";
import { useTheme } from "@/hooks/useTheme";
import type { Event } from "@/types/Event";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type RouteInfo = {
  distanciaKm: number;
  duracionMin: number;
};

type Props = {
  evento: Event | null; // el evento al que quiere ir el usuario
  onRouteReady?: (info: RouteInfo) => void; // opcional: para mostrar distancia/tiempo fuera
};

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export function EventRoute({ evento, onRouteReady }: Props) {
  const theme = useTheme();
  const { location, loading, error } = useUserLocation();
  const [routeError, setRouteError] = useState(false);

  // No renderizar nada si no hay evento seleccionado
  if (!evento) return null;

  // Mientras obtiene el GPS, mostrar indicador (fuera del mapa, en overlay)
  if (loading) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={[styles.overlayText, { color: theme.colors.text }]}>
          Obteniendo tu ubicación…
        </Text>
      </View>
    );
  }

  // Si no hay permiso de GPS
  if (error || !location) {
    return (
      <View style={styles.overlay}>
        <Text style={[styles.overlayText, { color: theme.colors.error }]}>
          {error ?? "No se pudo obtener tu ubicación."}
        </Text>
      </View>
    );
  }

  const destino = {
    latitude: evento.coordenadas.latitud,
    longitude: evento.coordenadas.longitud,
  };

  // MapViewDirections se renderiza DENTRO del MapView (como un Marker)
  // pero el overlay de error va fuera. Separamos ambas cosas:
  return (
    <>
      {routeError && (
        <View style={styles.overlay}>
          <Text style={[styles.overlayText, { color: theme.colors.error }]}>
            No se encontró ruta hacia este evento.
          </Text>
        </View>
      )}

      <MapViewDirections
        origin={location}
        destination={destino}
        apikey={GOOGLE_API_KEY}
        // Apariencia de la línea
        strokeWidth={5}
        strokeColor={theme.colors.accent} // naranjo = confirmar, coherente con la app
        lineDashPattern={[0]} // línea sólida
        // Callbacks
        onReady={(result) => {
          setRouteError(false);
          onRouteReady?.({
            distanciaKm: result.distance,
            duracionMin: Math.round(result.duration),
          });
        }}
        onError={() => setRouteError(true)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Estilos del overlay (mensaje fuera del mapa)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 99,
  },
  overlayText: {
    fontSize: 14,
    color: "white",
    flexShrink: 1,
  },
});