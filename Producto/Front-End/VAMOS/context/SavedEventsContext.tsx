// context/SavedEventsContext.tsx
//
// Estado de eventos guardados y confirmados.
//
// FIX aplicado: ahora usa useAuth() para saber cuándo hay token.
// Antes revisaba el token una sola vez al montar con getToken(),
// pero AuthContext aún no había terminado de cargar → siempre null
// → nunca sincronizaba con el backend → al cerrar la app se perdía todo.
//
// Ahora: escucha accessToken de AuthContext. Cuando cambia de null a
// un valor real, carga los eventos del backend automáticamente.

import { Event } from "@/types/Event";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
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
  const { accessToken } = useAuth();

  const [saved, setSaved] = useState<Event[]>([]);
  const [confirmed, setConfirmed] = useState<Event[]>([]);
  const [cargando, setCargando] = useState(false);

  // ── Cargar listas desde el backend ───────────────────────────────────────
  const refrescarEventos = useCallback(async () => {
    setCargando(true);
    try {
      console.log("📥 Cargando eventos guardados del backend...");

      // 1. Traer los IDs del backend
      const { saved: savedIds, confirmed: confirmedIds } = await getMisEventos();
      console.log(`📥 Backend respondió: ${savedIds.length} guardados, ${confirmedIds.length} confirmados`);

      // 2. Para cada ID, traer el evento completo.
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

      console.log("✅ Eventos guardados cargados correctamente");
    } catch (error) {
      console.error("❌ Error cargando eventos guardados:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  // ── Reaccionar al estado de autenticación ────────────────────────────────
  // Cuando accessToken cambia (login/logout), actuar:
  //   - null → limpiar listas (no hay sesión)
  //   - string → cargar desde el backend
  useEffect(() => {
    if (accessToken) {
      console.log("🔑 Token detectado, cargando eventos guardados...");
      refrescarEventos();
    } else {
      // Sin token: limpiar listas (logout o primera carga sin sesión)
      setSaved([]);
      setConfirmed([]);
    }
  }, [accessToken, refrescarEventos]);

  // ── Guardar evento (me interesa) ─────────────────────────────────────────
  function saveEvent(event: Event) {
    // Regla: confirmar > guardar (misma que el backend)
    if (confirmed.some((e) => e.id_externo === event.id_externo)) return;

    // Actualizar estado local inmediatamente (UX rápida)
    setSaved((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );

    // Sincronizar con backend
    if (accessToken) {
      guardarEvento(event.id_externo, "saved").catch((err) =>
        console.error("❌ Error sincronizando guardado:", err)
      );
    }
  }

  // ── Confirmar evento (voy a ir) ──────────────────────────────────────────
  function confirmEvent(event: Event) {
    // Mover de saved a confirmed (local)
    setSaved((prev) => prev.filter((e) => e.id_externo !== event.id_externo));
    setConfirmed((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );

    // Sincronizar con backend
    if (accessToken) {
      guardarEvento(event.id_externo, "confirmed").catch((err) =>
        console.error("❌ Error sincronizando confirmado:", err)
      );
    }
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