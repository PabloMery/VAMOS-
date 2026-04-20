import { useState, useEffect } from "react";
import { Event } from "../types/Event";
import { mockEvents } from "../data/mockEvents"; // 👈 importa el mock

const USE_MOCK = true; // 🔧 cambia a false cuando tengas la API lista

export function useEvents(lat: number, lng: number) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK) {
      // Simula un pequeño delay como si fuera una API real
      setTimeout(() => {
        setEvents(mockEvents);
        setLoading(false);
      }, 500);
      return;
    }

    if (!lat || !lng) return;

    fetch(`https://tu-api.com/events?lat=${lat}&lng=${lng}&radius=5000`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener eventos");
        return res.json();
      })
      .then((data: Event[]) => setEvents(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { events, loading, error };
}