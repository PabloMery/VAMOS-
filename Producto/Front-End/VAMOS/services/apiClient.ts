// app/services/apiClient.ts
//
// Cliente HTTP base. Todos los demás services importan apiRequest desde aquí.
<<<<<<< Updated upstream
// Maneja: URL base, headers, tokens JWT (access + refresh) y errores.

import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// RUTAS REALES DEL BACKEND (lo que existe hoy en el EC2)
// ---------------------------------------------------------------------------
//
// USUARIOS (bajo /api/usuarios/)
//   POST /api/usuarios/auth/google/      ← Login con Google ID Token → JWT
//   POST /api/usuarios/auth/refresh/     ← Renueva el access token
//   GET  /api/usuarios/perfil/           ← Datos del usuario autenticado
//   POST /api/usuarios/mi-asistencia/    ← Actualizar estado de asistencia
//
// EVENTOS (bajo /api/eventos/ — PENDIENTE, aún sin views en el backend)
//   GET  /api/eventos/                   ← TODO: listar eventos
//   GET  /api/eventos/<id>/              ← TODO: detalle de evento
//
// GRUPOS — No implementado en backend aún
//
// VAMBOT (servicio separado en puerto 8001)
//   Se conecta por separado, no pasa por este cliente.
// ---------------------------------------------------------------------------

=======
// Maneja: URL base, headers, token JWT y errores estándar.

import * as SecureStore from 'expo-secure-store';
// Verifica que las rutas del backend coincidan
// POST /api/auth/register/      POST /api/auth/login/      GET /api/auth/me/
//    GET  /api/eventos/            GET  /api/eventos/<id>/
//    POST /api/eventos/<id>/confirmar/    GET /api/eventos/confirmados/
//    POST /api/grupos/             POST /api/grupos/unirse/
//    GET  /api/grupos/<id>/        GET  /api/grupos/mis-grupos/
//    PATCH /api/grupos/<id>/estado/    DELETE /api/grupos/<id>/salir/
>>>>>>> Stashed changes
// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------
//
<<<<<<< Updated upstream
// La IP del EC2 cambia cada vez que encienden la instancia.
// Para no tocar código, creamos un archivo .env en la raíz del proyecto:
//
//   EXPO_PUBLIC_API_URL=http://34.228.69.6:8000/api
//   EXPO_PUBLIC_VAMBOT_URL=http://34.228.69.6:8001
//
// Expo lee automáticamente las variables que empiezan con EXPO_PUBLIC_.
// Cuando la IP cambie, solo editas .env y reinicias el servidor de Expo.
//
// Si la variable no existe (olvidaste crear .env), usa localhost como fallback.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const VAMBOT_BASE_URL =
  process.env.EXPO_PUBLIC_VAMBOT_URL ?? 'http://localhost:8001';

// ---------------------------------------------------------------------------
// MANEJO DE TOKENS
// ---------------------------------------------------------------------------
// El backend devuelve DOS tokens al hacer login con Google:
//   - access:  dura poco (minutos/horas), se manda en cada petición.
//   - refresh: dura más (días), sirve para pedir un nuevo access sin re-login.

const ACCESS_KEY = 'vamos_access_token';
const REFRESH_KEY = 'vamos_refresh_token';

/** Guarda ambos tokens después de un login exitoso. */
export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

/** Obtiene el access token (el que se manda en cada petición). */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

/** Obtiene el refresh token (para renovar el access). */
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

/** Borra ambos tokens (logout). */
export async function deleteTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// Alias para compatibilidad con código que ya usa estos nombres:
export const saveToken = (token: string) =>
  SecureStore.setItemAsync(ACCESS_KEY, token);
export const deleteToken = deleteTokens;

// ---------------------------------------------------------------------------
// ERROR PERSONALIZADO
// ---------------------------------------------------------------------------
// Cuando el backend responde con error (4xx o 5xx), lanzamos esta clase.
=======
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
>>>>>>> Stashed changes
// Así en las pantallas puedes hacer:
//
//   try { ... }
//   catch (e) {
<<<<<<< Updated upstream
//     if (e instanceof ApiError && e.status === 401) { /* sesión expirada */ }
=======
//     if (e instanceof ApiError && e.status === 401) { ... }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
// REFRESH AUTOMÁTICO
// ---------------------------------------------------------------------------
// Si una petición falla con 401 (token expirado), intentamos renovar el
// access token usando el refresh token. Si la renovación funciona,
// repetimos la petición original. Si falla, borramos todo (sesión muerta).

async function intentarRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // El refresh token también expiró → sesión muerta
      await deleteTokens();
      return null;
    }

    const data = await response.json();
    // El endpoint de refresh devuelve un nuevo access token
    await SecureStore.setItemAsync(ACCESS_KEY, data.access);
    return data.access;
  } catch {
    await deleteTokens();
    return null;
  }
}

// ---------------------------------------------------------------------------
=======
>>>>>>> Stashed changes
// FUNCIÓN PRINCIPAL
// ---------------------------------------------------------------------------

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Si la ruta requiere estar logueado, pasa auth: true (es el default).
<<<<<<< Updated upstream
  // Para login con Google pasa auth: false.
=======
  // Para login/registro pasa auth: false.
>>>>>>> Stashed changes
  auth?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
<<<<<<< Updated upstream
  options: RequestOptions = {},
=======
  options: RequestOptions = {}
>>>>>>> Stashed changes
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

<<<<<<< Updated upstream
=======
  // Si la petición es autenticada, añadimos el token al header Authorization.
>>>>>>> Stashed changes
  if (auth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

<<<<<<< Updated upstream
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
=======
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
>>>>>>> Stashed changes
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

<<<<<<< Updated upstream
  // --- AUTO-REFRESH ---
  // Si da 401 y la petición era autenticada, intentamos renovar el token.
  if (response.status === 401 && auth) {
    const nuevoToken = await intentarRefresh();
    if (nuevoToken) {
      // Tenemos token nuevo → repetimos la petición original
      headers['Authorization'] = `Bearer ${nuevoToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  // Algunas respuestas (DELETE 204) no traen cuerpo.
=======
  // Algunas respuestas (DELETE 204) no traen cuerpo; lo tratamos aparte.
>>>>>>> Stashed changes
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}