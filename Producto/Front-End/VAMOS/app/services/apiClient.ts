// app/services/apiClient.ts
//
// Cliente HTTP base. Todos los demás services importan apiRequest desde aquí.
// Maneja: URL base, headers, token JWT y errores estándar.

import * as SecureStore from 'expo-secure-store';
// Verifica que las rutas del backend coincidan
// POST /api/auth/register/      POST /api/auth/login/      GET /api/auth/me/
//    GET  /api/eventos/            GET  /api/eventos/<id>/
//    POST /api/eventos/<id>/confirmar/    GET /api/eventos/confirmados/
//    POST /api/grupos/             POST /api/grupos/unirse/
//    GET  /api/grupos/<id>/        GET  /api/grupos/mis-grupos/
//    PATCH /api/grupos/<id>/estado/    DELETE /api/grupos/<id>/salir/
// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------
//
// Ajusta esta URL según dónde estés probando la app:
//   - iOS simulator       → http://localhost:8000
//   - Android emulator    → http://10.0.2.2:8000
//   - Dispositivo físico  → http://<IP-de-tu-PC-en-la-red>:8000
//                           (ej: http://192.168.1.50:8000)
//   - Web (expo start --web) → http://localhost:8000
//
// El "/api" final asume que en Django montaste tus rutas bajo /api/.
export const API_BASE_URL = 'http://localhost:8000/api';

// Clave con la que guardamos el JWT en el almacenamiento seguro del teléfono.
const TOKEN_KEY = 'vamos_jwt_token';

// ---------------------------------------------------------------------------
// MANEJO DEL TOKEN
// ---------------------------------------------------------------------------

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// ERROR PERSONALIZADO
// ---------------------------------------------------------------------------
// Cuando el backend responde mal (4xx o 5xx), lanzamos esta clase.
// Así en las pantallas puedes hacer:
//
//   try { ... }
//   catch (e) {
//     if (e instanceof ApiError && e.status === 401) { ... }
//   }

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ---------------------------------------------------------------------------

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Si la ruta requiere estar logueado, pasa auth: true (es el default).
  // Para login/registro pasa auth: false.
  auth?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Si la petición es autenticada, añadimos el token al header Authorization.
  if (auth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Algunas respuestas (DELETE 204) no traen cuerpo; lo tratamos aparte.
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}