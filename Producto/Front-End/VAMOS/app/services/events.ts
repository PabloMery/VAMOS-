// app/services/events.ts
//
// Funciones para hablar con los endpoints de eventos del backend Django.

import { Event } from '@/types/Event';
import { apiRequest } from './apiClient';

// Filtro por fecha que envía el front. El backend debe entender estos valores.
export type EventFilter = 'hoy' | 'semana' | 'mes' | 'todos';

// ---------------------------------------------------------------------------
// LECTURA
// ---------------------------------------------------------------------------

/**
 * Devuelve la lista de eventos. Si pasas un filtro lo agrega como query param.
 * Ejemplo de URL final: /eventos/?fecha=hoy
 */
export async function getEvents(filter: EventFilter = 'todos'): Promise<Event[]> {
  const query = filter !== 'todos' ? `?fecha=${filter}` : '';
  return apiRequest<Event[]>(`/eventos/${query}`);
}

/** Devuelve el detalle completo de un evento. */
export async function getEventById(id: string): Promise<Event> {
  return apiRequest<Event>(`/eventos/${id}/`);
}

// ---------------------------------------------------------------------------
// ACCIONES DEL USUARIO SOBRE UN EVENTO
// ---------------------------------------------------------------------------
//
// "Confirmar" significa "voy a ir". Es server-side porque debe verse en los
// grupos y para enviar notificaciones. El "Guardar" se queda en el cliente
// (SavedEventsContext), así que aquí no aparece.

/** Marca que el usuario actual irá al evento. */
export async function confirmEvent(eventId: string): Promise<void> {
  await apiRequest<void>(`/eventos/${eventId}/confirmar/`, {
    method: 'POST',
  });
}

/** Quita la confirmación. */
export async function unconfirmEvent(eventId: string): Promise<void> {
  await apiRequest<void>(`/eventos/${eventId}/confirmar/`, {
    method: 'DELETE',
  });
}

/** Trae todos los eventos que el usuario actual confirmó. */
export async function getConfirmedEvents(): Promise<Event[]> {
  return apiRequest<Event[]>('/eventos/confirmados/');
}