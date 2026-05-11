// app/hooks/useUserLocation.ts
//
// Hook que pide permiso de GPS y devuelve la ubicación actual del usuario.
// Úsalo en cualquier pantalla que necesite saber dónde está el usuario.

import { useState, useEffect } from "react";
import * as Location from "expo-location";

type Coordenadas = {
  latitude: number;
  longitude: number;
};

type UseUserLocationResult = {
  location: Coordenadas | null; // null mientras carga o si hubo error
  loading: boolean;
  error: string | null;
};

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordenadas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true; // evita actualizar estado si el componente ya se desmontó

    (async () => {
      try {
        // 1. Pedir permiso al usuario
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (active) {
            setError(
              "Necesitamos acceso a tu ubicación para mostrarte la ruta."
            );
            setLoading(false);
          }
          return;
        }

        // 2. Obtener posición actual
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // buen balance velocidad/precisión
        });

        if (active) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      } catch (e) {
        if (active) {
          setError("No se pudo obtener tu ubicación. Intenta de nuevo.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Cleanup: si el componente se desmonta antes de terminar, no actualizar estado
    return () => {
      active = false;
    };
  }, []);

  return { location, loading, error };
}