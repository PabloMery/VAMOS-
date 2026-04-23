import { useEffect, useState } from "react";
import { mockEvents } from "../data/mockEvents";
import { Event } from "../types/Event";

const USE_MOCK = true;

export function useEvents(lat: number, lng: number, date: Date) { // 👈 recibe date
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convierte Date a string "2026-04-22" para comparar con fecha_evento
  const dateString = date.toISOString().split("T")[0];

  useEffect(() => {
    setLoading(true);

    if (USE_MOCK) {
      setTimeout(() => {
        const filtered = mockEvents.filter(
          (e) => e.fecha_evento === dateString  // 👈 solo eventos de ese día
        );
        setEvents(filtered);
        setLoading(false);
      }, 300);
      return;
    }

    if (!lat || !lng) return;

    fetch(`https://tu-api.com/events?lat=${lat}&lng=${lng}&date=${dateString}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener eventos");
        return res.json();
      })
      .then((data: Event[]) => setEvents(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lat, lng, dateString]); // 👈 se re-ejecuta cuando cambia la fecha

  return { events, loading, error };
}