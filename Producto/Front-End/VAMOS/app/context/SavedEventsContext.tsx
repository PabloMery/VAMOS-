import { Event } from "@/types/Event";
import { createContext, ReactNode, useContext, useState } from "react";

type SavedEventsContextType = {
  saved: Event[];
  confirmed: Event[];
  saveEvent: (event: Event) => void;
  confirmEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
};

const SavedEventsContext = createContext<SavedEventsContextType | null>(null);

// Hook para usar el contexto fácilmente
export function useSavedEvents() {
  const ctx = useContext(SavedEventsContext);
  if (!ctx) throw new Error("useSavedEvents debe usarse dentro de SavedEventsProvider");
  return ctx;
}

// Proveedor que envuelve toda la app
export function SavedEventsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Event[]>([]);
  const [confirmed, setConfirmed] = useState<Event[]>([]);

  function saveEvent(event: Event) {
    // Evita duplicados
    setSaved((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );
  }

  function confirmEvent(event: Event) {
    // Al confirmar, lo saca de guardados y lo pone en confirmados
    setSaved((prev) => prev.filter((e) => e.id_externo !== event.id_externo));
    setConfirmed((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );
  }

  function removeEvent(id: string) {
    setSaved((prev) => prev.filter((e) => e.id_externo !== id));
    setConfirmed((prev) => prev.filter((e) => e.id_externo !== id));
  }

  return (
    <SavedEventsContext.Provider
      value={{ saved, confirmed, saveEvent, confirmEvent, removeEvent }}
    >
      {children}
    </SavedEventsContext.Provider>
  );
}