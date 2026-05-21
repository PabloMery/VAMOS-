// context/SavedEventsContext.tsx
//
// Fase 3: sincroniza guardados/confirmados con el backend.
// - Si hay token → carga los IDs desde el backend al montar
// - Cada saveEvent/confirmEvent también llama al backend
// - removeEvent sigue siendo solo local (falta endpoint DELETE en backend)

import { Event } from "@/types/Event";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { getToken } from "../services/apiClient";
import { getMisEventos, guardarEvento } from "../services/savedEventsApi";
import { getEventById } from "../services/events";

type SavedEventsContextType = {
  saved: Event[];
  confirmed: Event[];
  cargando: boolean;
  saveEvent: (event: Event) => void;
  confirmEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  isSaved: (id: string) => boolean;
  isConfirmed: (id: string) => boolean;
  refrescarEventos: () => Promise<void>;
};

const SavedEventsContext = createContext<SavedEventsContextType | null>(null);

export function useSavedEvents() {
  const ctx = useContext(SavedEventsContext);
  if (!ctx) throw new Error("useSavedEvents debe usarse dentro de SavedEventsProvider");
  return ctx;
}

export function SavedEventsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Event[]>([]);
  const [confirmed, setConfirmed] = useState<Event[]>([]);
  const [cargando, setCargando] = useState(false);

  // ── Cargar listas desde el backend ───────────────────────────────────────
  // El backend devuelve solo IDs, así que después hay que buscar el evento
  // completo para cada uno.
  const refrescarEventos = useCallback(async () => {
    setCargando(true);
    try {
      // 1. Traer los IDs del backend
      const { saved: savedIds, confirmed: confirmedIds } = await getMisEventos();

      // 2. Para cada ID, traer el evento completo.
      //    Juntamos todos los IDs para no hacer llamadas duplicadas.
      const todosIds = [...new Set([...savedIds, ...confirmedIds])];
      const eventosMap = new Map<string, Event>();

      // Traer todos en paralelo
      const resultados = await Promise.all(
        todosIds.map((id) => getEventById(id))
      );

      resultados.forEach((evento) => {
        if (evento) eventosMap.set(evento.id_externo, evento);
      });

      // 3. Armar las listas con los eventos completos
      setSaved(
        savedIds
          .map((id) => eventosMap.get(id))
          .filter((e): e is Event => e !== undefined)
      );
      setConfirmed(
        confirmedIds
          .map((id) => eventosMap.get(id))
          .filter((e): e is Event => e !== undefined)
      );
    } catch (error) {
      console.error("Error cargando eventos guardados:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  // Al montar, cargar solo si hay token
  useEffect(() => {
    const cargar = async () => {
      const token = await getToken();
      if (!token) {
        console.log("⏭️ Sin token, eventos guardados solo en local");
        return;
      }
      refrescarEventos();
    };
    cargar();
  }, [refrescarEventos]);

  // ── Guardar evento (me interesa) ─────────────────────────────────────────
  function saveEvent(event: Event) {
    // Regla: confirmar > guardar (misma que el backend)
    if (confirmed.some((e) => e.id_externo === event.id_externo)) return;

    // Actualizar estado local inmediatamente (UX rápida)
    setSaved((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );

    // Sincronizar con backend (sin await para no bloquear la UI)
    getToken().then((token) => {
      if (token) {
        guardarEvento(event.id_externo, "saved").catch((err) =>
          console.error("Error sincronizando guardado:", err)
        );
      }
    });
  }

  // ── Confirmar evento (voy a ir) ──────────────────────────────────────────
  function confirmEvent(event: Event) {
    // Mover de saved a confirmed (local)
    setSaved((prev) => prev.filter((e) => e.id_externo !== event.id_externo));
    setConfirmed((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );

    // Sincronizar con backend
    getToken().then((token) => {
      if (token) {
        guardarEvento(event.id_externo, "confirmed").catch((err) =>
          console.error("Error sincronizando confirmado:", err)
        );
      }
    });
  }

  // ── Quitar evento ────────────────────────────────────────────────────────
  // TODO: Cuando el backend tenga DELETE, agregar la llamada aquí.
  // Por ahora solo quita del estado local (se pierde al cerrar la app).
  function removeEvent(id: string) {
    setSaved((prev) => prev.filter((e) => e.id_externo !== id));
    setConfirmed((prev) => prev.filter((e) => e.id_externo !== id));
  }

  const isSaved = (id: string) => saved.some((e) => e.id_externo === id);
  const isConfirmed = (id: string) => confirmed.some((e) => e.id_externo === id);

  return (
    <SavedEventsContext.Provider
      value={{
        saved,
        confirmed,
        cargando,
        saveEvent,
        confirmEvent,
        removeEvent,
        isSaved,
        isConfirmed,
        refrescarEventos,
      }}
    >
      {children}
    </SavedEventsContext.Provider>
  );
}

export default function SavedEventsContextPlaceholder() { return null; }