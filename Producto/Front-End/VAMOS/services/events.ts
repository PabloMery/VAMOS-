// services/events.ts
//
// Funciones para obtener eventos.
// USE_MOCK = false → usa la API real de Django.
// Si necesitas volver al mock (backend caído), cámbialo a true.

import { Event } from '@/types/Event';
import { apiRequest } from './apiClient';
import { mockEvents } from '@/data/mockEvents';

// ---------------------------------------------------------------------------
// SWITCH MOCK ↔ REAL
// ---------------------------------------------------------------------------
const USE_MOCK = false;  // ← Ahora usa la API real

// ---------------------------------------------------------------------------
// FILTRO
// ---------------------------------------------------------------------------
export type EventFilter = 'hoy' | 'semana' | 'mes' | 'todos';

// ---------------------------------------------------------------------------
// MAPEO: respuesta del backend → tipo Event de la app
// ---------------------------------------------------------------------------
// El backend devuelve campos con nombres distintos a los que usa la app.
// Esta función traduce para que el resto de la app no tenga que cambiar.
//
//   Backend                →  App (Event)
//   precio_numerico        →  precio
//   estado_general         →  estado_evento
//   fecha_proxima          →  fecha_evento
//   fechas_evento (array)  →  (se ignora, usamos fecha_proxima o la fecha filtrada)

interface EventoAPI {
  id_externo: string;
  nombre_evento: string;
  fechas_evento: { fecha: string; estado_dia: string }[];
  fecha_proxima: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  horario_variable: boolean;
  categoria: string | null;
  precio_numerico: number | null;
  requiere_inscripcion: boolean;
  cupos_llenos: boolean;
  lugar_texto: string;
  coordenadas: { latitud: number; longitud: number } | null;
  url_oficial: string;
  estado_general: string | null;
  origen_datos: string;
}

function mapearEvento(raw: EventoAPI, fechaFiltro?: string): Event {
  // Si filtramos por fecha exacta y el evento tiene esa fecha, usarla.
  // Si no, usar fecha_proxima. Si tampoco hay, usar la primera fecha disponible.
  let fechaEvento = raw.fecha_proxima ?? '';

  if (fechaFiltro && /^\d{4}-\d{2}-\d{2}$/.test(fechaFiltro)) {
    // Verificar si el evento tiene la fecha que estamos filtrando
    const tieneFecha = raw.fechas_evento?.some((f) => f.fecha === fechaFiltro);
    if (tieneFecha) {
      fechaEvento = fechaFiltro;
    }
  }

  // Buscar el estado_dia de la fecha específica que estamos mostrando
  const fechaInfo = raw.fechas_evento?.find((f) => f.fecha === fechaEvento);
  const estadoEvento = fechaInfo?.estado_dia ?? raw.estado_general ?? '';

if (fechaFiltro) {
  const tieneFecha = raw.fechas_evento?.some(f => f.fecha === fechaFiltro);
  console.log('🎯',
    raw.id_externo.slice(0, 30),
    '| tieneFecha=', tieneFecha,
    '| total fechas=', raw.fechas_evento?.length
  );
}
return {
    id_externo: raw.id_externo,
    nombre_evento: raw.nombre_evento,
    fecha_evento: fechaEvento,
    fechas_evento: raw.fechas_evento?.map((f: { fecha: string }) => f.fecha) ?? [fechaEvento],
    hora_inicio: raw.hora_inicio,
    hora_fin: raw.hora_fin,
    horario_variable: raw.horario_variable ?? false,
    categoria: raw.categoria ?? '',
    precio: raw.precio_numerico,
    requiere_inscripcion: raw.requiere_inscripcion ?? false,
    lugar_texto: raw.lugar_texto ?? '',
    coordenadas: raw.coordenadas ?? { latitud: 0, longitud: 0 },
    url_oficial: raw.url_oficial ?? '',
    estado_evento: estadoEvento,
    origen_datos: raw.origen_datos ?? '',
    descripcion: '',
    imagen_url: null,
  };
}

// ---------------------------------------------------------------------------
// LECTURA
// ---------------------------------------------------------------------------

/**
 * Devuelve la lista de eventos.
 *
 * Acepta un EventFilter ('hoy', 'semana', 'mes', 'todos')
 * o una fecha exacta como string 'YYYY-MM-DD'.
 *
 * Ejemplos:
 *   getEvents('hoy')          → GET /api/eventos/?fecha=hoy
 *   getEvents('2026-05-20')   → GET /api/eventos/?fecha=2026-05-20
 *   getEvents('todos')        → GET /api/eventos/
 */
export async function getEvents(
  filter: EventFilter | string = 'todos',
): Promise<Event[]> {
  if (USE_MOCK) {
    return filtrarEventosMock(filter);
  }

  const query = filter !== 'todos' ? `?fecha=${filter}` : '';

  try {
    const datos = await apiRequest<EventoAPI[]>(`/eventos/${query}`, { auth: false });
    return datos.map((raw) => mapearEvento(raw, filter));
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return [];
  }
}

/**
 * Devuelve el detalle completo de un evento por su id_externo.
 */
export async function getEventById(id: string): Promise<Event | null> {
  if (USE_MOCK) {
    return mockEvents.find((e) => e.id_externo === id) ?? null;
  }

  try {
    const raw = await apiRequest<EventoAPI>(`/eventos/${id}/`, { auth: false });
    return mapearEvento(raw);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// FILTRO LOCAL (solo para mock)
// ---------------------------------------------------------------------------

function filtrarEventosMock(filter: string): Event[] {
  if (filter === 'todos') return mockEvents;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return mockEvents.filter((evento) => {
    const partes = evento.fecha_evento.includes('-')
      ? evento.fecha_evento.split('-')
      : [];

    let fechaEvento: Date;
    if (partes.length === 3 && partes[0].length === 4) {
      fechaEvento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    } else if (partes.length === 3) {
      fechaEvento = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    } else {
      return true;
    }

    fechaEvento.setHours(0, 0, 0, 0);

    if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
      return evento.fecha_evento === filter;
    }

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