// app/services/usersApi.ts
//
// Funciones de autenticación y perfil. Hablan con la app Django `usuarios/`.

import { User } from '@/types/User';
import { apiRequest, deleteToken, saveToken } from './apiClient';

// ---------------------------------------------------------------------------
// TIPOS DE PAYLOADS
// ---------------------------------------------------------------------------

export type RegisterPayload = {
  email: string;
  password: string;
  fecha_nacimiento: string; // formato YYYY-MM-DD; el backend valida +18
};

// Lo que devuelve un login JWT estándar (djangorestframework-simplejwt).
type LoginResponse = {
  access: string;
  refresh: string;
};

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

/**
 * Registra un nuevo usuario. El backend rechaza la petición si el usuario
 * tiene menos de 18 años (validación de edad).
 */
export async function register(payload: RegisterPayload): Promise<User> {
  return apiRequest<User>('/auth/register/', {
    method: 'POST',
    body: payload,
    auth: false, // todavía no hay token
  });
}

/**
 * Inicia sesión. Si sale bien, guarda el JWT en SecureStore para que
 * apiRequest lo use automáticamente en las siguientes llamadas.
 */
export async function login(email: string, password: string): Promise<void> {
  const data = await apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  await saveToken(data.access);
  // Si más adelante quieres manejar el refresh token, guárdalo también aquí.
}

/** Cierra sesión: borra el token local. No requiere llamada al backend. */
export async function logout(): Promise<void> {
  await deleteToken();
}

// ---------------------------------------------------------------------------
// PERFIL
// ---------------------------------------------------------------------------

/** Trae los datos del usuario autenticado. Útil al abrir la app. */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me/');
}