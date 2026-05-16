// app/services/events.ts
//
// Funciones para obtener eventos.
//
// ESTADO ACTUAL DEL BACKEND:
//   eventos/views.py está vacío → NO hay endpoints de eventos todavía.
//   Cuando tus compañeros los implementen, solo cambias USE_MOCK = false
//   y todo debería funcionar (las funciones ya apuntan a las rutas esperadas).
//
// CONFIRMAR ASISTENCIA:
//   No existe un endpoint /eventos/<id>/confirmar/.
//   Lo que sí existe es POST /api/usuarios/mi-asistencia/ (en usersApi.ts).
//   "Guardar" sigue siendo 100% local (SavedEventsContext).

import { Event } from '@/types/Event';
import { apiRequest } from './apiClient';
import { mockEvents } from '@/data/mockEvents';

// ---------------------------------------------------------------------------
// SWITCH MOCK ↔ REAL
// ---------------------------------------------------------------------------
// Ponlo en false cuando el backend tenga los endpoints de eventos listos.
// Así no tienes que cambiar nada más en la app.
const USE_MOCK = true;

// ---------------------------------------------------------------------------
// FILTRO
// ---------------------------------------------------------------------------

export type EventFilter = 'hoy' | 'semana' | 'mes' | 'todos';

// ---------------------------------------------------------------------------
// LECTURA
// ---------------------------------------------------------------------------

/**
 * Devuelve la lista de eventos.
 *
 * Mientras USE_MOCK sea true → devuelve los datos de mockEvents.ts.
 * Cuando sea false → llama a GET /api/eventos/?fecha=hoy|semana|mes
 *
 * NOTA: cuando el backend implemente este endpoint, verifica que:
 *   1. La respuesta sea un array de objetos con los campos de tipo Event
 *   2. El query param "fecha" funcione como filtro
 *   3. Las coordenadas vengan como { latitud, longitud } (no lat/lng)
 */
export async function getEvents(
  filter: EventFilter = 'todos',
): Promise<Event[]> {
  if (USE_MOCK) {
    return filtrarEventosMock(filter);
  }

  const query = filter !== 'todos' ? `?fecha=${filter}` : '';
  return apiRequest<Event[]>(`/eventos/${query}`);
}

/**
 * Devuelve el detalle completo de un evento por su id_externo.
 *
 * Con mock → busca en el array local.
 * Sin mock → llama a GET /api/eventos/<id>/
 */
export async function getEventById(id: string): Promise<Event | null> {
  if (USE_MOCK) {
    return mockEvents.find((e) => e.id_externo === id) ?? null;
  }

  return apiRequest<Event>(`/eventos/${id}/`);
}

// ---------------------------------------------------------------------------
// FILTRO LOCAL (solo para mock)
// ---------------------------------------------------------------------------

function filtrarEventosMock(filter: EventFilter): Event[] {
  if (filter === 'todos') return mockEvents;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return mockEvents.filter((evento) => {
    // fecha_evento puede venir como "YYYY-MM-DD" o "DD-MM-YYYY"
    const partes = evento.fecha_evento.includes('-')
      ? evento.fecha_evento.split('-')
      : [];

    let fechaEvento: Date;
    if (partes.length === 3 && partes[0].length === 4) {
      // YYYY-MM-DD
      fechaEvento = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2]),
      );
    } else if (partes.length === 3) {
      // DD-MM-YYYY
      fechaEvento = new Date(
        Number(partes[2]),
        Number(partes[1]) - 1,
        Number(partes[0]),
      );
    } else {
      return true; // si no se puede parsear, incluirlo
    }

    fechaEvento.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'hoy':
        return fechaEvento.getTime() === hoy.getTime();
      case 'semana': {
        const enUnaSemana = new Date(hoy);
        enUnaSemana.setDate(enUnaSemana.getDate() + 7);
        return fechaEvento >= hoy && fechaEvento <= enUnaSemana;
      }
      case 'mes': {
        const enUnMes = new Date(hoy);
        enUnMes.setMonth(enUnMes.getMonth() + 1);
        return fechaEvento >= hoy && fechaEvento <= enUnMes;
      }
      default:
        return true;
    }
  });
}