// hooks/useEvents.ts
//
// Hook que obtiene eventos para una fecha específica.
// Ahora usa getEvents() de services/events.ts (que decide si es mock o API real).
//
// USO:
//   const { events, loading, error } = useEvents(lat, lng, date);
//
// El parámetro date (Date) se convierte a "YYYY-MM-DD" y se manda al backend.
// lat y lng se mantienen en la firma por si en el futuro se filtra por ubicación.

import { useEffect, useState } from "react";
import { Event } from "../types/Event";
import { getEvents } from "@/services/events";

export function useEvents(lat: number, lng: number, date: Date) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convierte Date a string "YYYY-MM-DD"
  const dateString = date.toISOString().split("T")[0];

  useEffect(() => {
    let cancelled = false;  // evita actualizar estado si el componente se desmontó

    setLoading(true);
    setError(null);

    getEvents(dateString)
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Error al obtener eventos");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    // Cleanup: si el efecto se re-ejecuta antes de que termine el fetch,
    // ignoramos la respuesta anterior.
    return () => {
      cancelled = true;
    };
  }, [dateString]); // se re-ejecuta cuando cambia la fecha

  return { events, loading, error };
}