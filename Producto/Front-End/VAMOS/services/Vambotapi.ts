// app/services/vambotApi.ts
//
// Cliente para el servicio de Vambot (FastAPI en puerto 8001).
// Este servicio es SEPARADO del backend Django — tiene su propia URL.
//
// Endpoint único:
//   POST /ask
//   Body:    { mensaje: string, latitud?: number, longitud?: number }
//   Returns: { respuesta_texto: string, eventos_encontrados: EventoVambot[] }

import { VAMBOT_BASE_URL } from './apiClient';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

/** Un evento que Vambot encontró como relevante a la pregunta. */
export type EventoVambot = {
  titulo: string;
  resumen_corto: string;
  distancia_estimada: string | null;
  fecha: string;
  link_url: string;
  datos_frescos: boolean;
};

/** Lo que devuelve POST /ask */
export type VambotResponse = {
  respuesta_texto: string;
  eventos_encontrados: EventoVambot[];
};

/** Lo que mandamos al bot */
type VambotRequest = {
  mensaje: string;
  latitud?: number;
  longitud?: number;
};

// ---------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Envía un mensaje a Vambot y devuelve su respuesta.
 *
 * No usa apiRequest() porque Vambot corre en otro puerto y no necesita JWT.
 * Es un fetch directo al servicio de IA.
 *
 * @param mensaje  - La pregunta del usuario (máx 500 caracteres)
 * @param coords   - Ubicación opcional para recomendaciones cercanas
 *
 * Errores posibles del backend:
 *   422 → mensaje vacío, muy largo, o con patrones sospechosos
 *   429 → demasiadas solicitudes (rate limit de Gemini)
 *   503 → servicio de IA o base de datos no disponible
 */
export async function askVambot(
  mensaje: string,
  coords?: { latitud: number; longitud: number },
): Promise<VambotResponse> {
  const body: VambotRequest = {
    mensaje,
    ...(coords && { latitud: coords.latitud, longitud: coords.longitud }),
  };

  // Timeout de 15 segundos para no dejar al usuario esperando eternamente.
  // Si el servidor no responde en ese tiempo, cancelamos la petición.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(`${VAMBOT_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error: any) {
    clearTimeout(timeout);
    // AbortError = timeout, TypeError = sin conexión
    if (error.name === 'AbortError') {
      throw new VambotError(0, 'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.');
    }
    throw new VambotError(0, 'No se pudo conectar al servidor. Verifica que tengas internet.');
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    // Mensajes amigables según el código de error
    if (response.status === 422) {
      // El backend valida: min 1 char, max 500 chars, sin prompt injection
      const detalle =
        errorData?.detail?.[0]?.msg ?? 'Mensaje no válido. Intenta reformularlo.';
      throw new VambotError(422, detalle);
    }
    if (response.status === 429) {
      throw new VambotError(
        429,
        'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.',
      );
    }
    if (response.status === 503) {
      throw new VambotError(
        503,
        'El servicio no está disponible en este momento. Intenta más tarde.',
      );
    }

    throw new VambotError(
      response.status,
      'Ocurrió un error inesperado. Intenta de nuevo.',
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// ERROR PERSONALIZADO
// ---------------------------------------------------------------------------

export class VambotError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'VambotError';
    this.status = status;
  }
}