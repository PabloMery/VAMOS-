import { Event } from "@/types/Event";
import { createContext, ReactNode, useContext, useState } from "react";

type SavedEventsContextType = {
  saved: Event[];
  confirmed: Event[];
  saveEvent: (event: Event) => void;
  confirmEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  // --- NUEVAS FUNCIONES ---
  isSaved: (id: string) => boolean;
  isConfirmed: (id: string) => boolean;
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

  function saveEvent(event: Event) {
    // Si ya está confirmado, no lo agregamos a guardados (confirmar > guardar)
    if (confirmed.some((e) => e.id_externo === event.id_externo)) return;

    setSaved((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );
  }

  function confirmEvent(event: Event) {
    setSaved((prev) => prev.filter((e) => e.id_externo !== event.id_externo));
    setConfirmed((prev) =>
      prev.find((e) => e.id_externo === event.id_externo) ? prev : [...prev, event]
    );
  }

  function removeEvent(id: string) {
    setSaved((prev) => prev.filter((e) => e.id_externo !== id));
    setConfirmed((prev) => prev.filter((e) => e.id_externo !== id));
  }

  // --- IMPLEMENTACIÓN DE LAS NUEVAS FUNCIONES ---
  const isSaved = (id: string) => saved.some((e) => e.id_externo === id);
  const isConfirmed = (id: string) => confirmed.some((e) => e.id_externo === id);

  return (
    <SavedEventsContext.Provider
      value={{ 
        saved, 
        confirmed, 
        saveEvent, 
        confirmEvent, 
        removeEvent,
        isSaved,      // <-- Pasarlo al Provider
        isConfirmed   // <-- Pasarlo al Provider
      }}
    >
      {children}
    </SavedEventsContext.Provider>
  );
}

export default function SavedEventsContextPlaceholder() { return null; }