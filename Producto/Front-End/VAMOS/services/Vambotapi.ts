// app/services/Vambotapi.ts
//
// Cliente para el servicio de Vambot.
// El flujo correcto es:
//
//   App móvil → Orquestador Node:3000/chat → Discovery FastAPI:8001/ask
//
// El orquestador se encarga de:
//   1. Validar el JWT del usuario
//   2. Guardar el historial de conversación en PostgreSQL
//   3. Reenviar la pregunta al Discovery Service (FastAPI)
//
// La URL base apunta al orquestador (puerto 3000), NO al FastAPI directamente.

import { getToken } from './apiClient';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------
// En el .env del frontend agregar:
//   EXPO_PUBLIC_ORQUESTADOR_URL=http://TU_IP_EC2:3000
//
// Si la variable no existe usa localhost como fallback.
const ORQUESTADOR_URL =
  process.env.EXPO_PUBLIC_ORQUESTADOR_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

/** Un evento que Vambot encontró como relevante a la pregunta. */
export type EventoVambot = {
  titulo:             string;
  resumen_corto:      string;
  distancia_estimada: string | null;
  fecha:              string;
  link_url:           string;
  datos_frescos:      boolean;
};

/** Lo que devuelve POST /chat del orquestador */
export type VambotResponse = {
  respuesta_texto:     string;
  eventos_encontrados: EventoVambot[];
};

/** Lo que mandamos al orquestador */
type VambotRequest = {
  mensaje:   string;
  latitud?:  number;
  longitud?: number;
};

// ---------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Envía un mensaje a Vambot a través del orquestador Node.js.
 *
 * El orquestador valida el JWT, guarda el historial y reenvía
 * la pregunta al Discovery Service (FastAPI).
 *
 * @param mensaje - La pregunta del usuario (máx 500 caracteres)
 * @param coords  - Ubicación opcional para recomendaciones cercanas
 *
 * Errores posibles:
 *   401 → token expirado o inválido (hay que re-loguearse)
 *   422 → mensaje con contenido no permitido
 *   429 → rate limit de Gemini
 *   504 → timeout del Discovery Service
 *   500 → error interno del orquestador
 */
export async function askVambot(
  mensaje:  string,
  coords?:  { latitud: number; longitud: number },
): Promise<VambotResponse> {

  // 1. Obtener el JWT del usuario desde SecureStore
  const token = await getToken();

  if (!token) {
    throw new VambotError(
      401,
      'No hay sesión activa. Por favor inicia sesión para usar el asistente.',
    );
  }

  // 2. Armar el body
  const body: VambotRequest = {
    mensaje,
    ...(coords && { latitud: coords.latitud, longitud: coords.longitud }),
  };

  // 3. Timeout de 25 segundos (un poco más que el timeout del orquestador)
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 25_000);

  let response: Response;
  try {
    response = await fetch(`${ORQUESTADOR_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': `Bearer ${token}`,   // ← JWT del usuario
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      throw new VambotError(
        0,
        'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.',
      );
    }
    throw new VambotError(
      0,
      'No se pudo conectar al servidor. Verifica que tengas internet.',
    );
  }
  clearTimeout(timeout);

  // 4. Manejo de errores HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detalle   = errorData?.error ?? null;

    switch (response.status) {
      case 401:
        throw new VambotError(
          401,
          'Tu sesión expiró. Por favor vuelve a iniciar sesión.',
        );
      case 422:
        throw new VambotError(
          422,
          detalle ?? 'Mensaje no válido. Intenta reformularlo.',
        );
      case 429:
        throw new VambotError(
          429,
          'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.',
        );
      case 504:
        throw new VambotError(
          504,
          'El servicio de IA tardó demasiado. Intenta de nuevo.',
        );
      default:
        throw new VambotError(
          response.status,
          detalle ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
        );
    }
  }

  // 5. Parsear y normalizar la respuesta del orquestador
  const data = await response.json();

  // El orquestador devuelve { sesion_id, respuesta_agente, eventos_encontrados }
  // Lo normalizamos al formato VambotResponse que usa AIChatModal
  return {
    respuesta_texto:     data.respuesta_agente     ?? '',
    eventos_encontrados: data.eventos_encontrados  ?? [],
  };
}

// ---------------------------------------------------------------------------
// ERROR PERSONALIZADO
// ---------------------------------------------------------------------------

export class VambotError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name   = 'VambotError';
    this.status = status;
  }
}