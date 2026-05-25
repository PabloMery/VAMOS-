// app/services/usersApi.ts
//
// Funciones de autenticación y perfil.
// Hablan con la app Django `usuarios/` (bajo /api/usuarios/).
//
// IMPORTANTE: El backend usa login con Google, NO email/password.
// El flujo es:
//   1. La app abre el login de Google (con expo-auth-session o similar)
//   2. Google devuelve un id_token
//   3. Mandamos ese id_token al backend
//   4. El backend lo verifica con Google y nos devuelve un JWT propio

import { apiRequest, saveTokens, deleteTokens } from './apiClient';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

/** Lo que devuelve el backend cuando el login con Google es exitoso. */
type GoogleAuthResponse = {
  access: string;
  refresh: string;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    avatar_url: string | null;
  };
};

/** Datos del usuario que devuelve GET /api/usuarios/perfil/ */
export type PerfilUsuario = {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  avatar_url: string | null;
};

/** Payload para actualizar el estado de asistencia a un evento. */
export type AsistenciaPayload = {
  evento_id: string;
  estado: string; // El backend lo convierte a mayúsculas automáticamente
};

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

/**
 * Login con Google.
 *
 * Recibe el id_token que Google entrega después de que el usuario
 * se autentica en el popup/modal de Google Sign-In.
 *
 * El backend verifica ese token con Google, crea (o encuentra) al usuario,
 * y nos devuelve un JWT propio (access + refresh) junto con los datos
 * del usuario.
 *
 * Ejemplo de uso desde la pantalla de login:
 *
 *   const googleIdToken = await loginConGoogle(); // expo-auth-session
 *   const usuario = await googleAuth(googleIdToken);
 *   // usuario tiene { id, email, nombre, apellido, avatar_url }
 */
export async function googleAuth(
  idToken: string,
): Promise<GoogleAuthResponse['usuario']> {
  const data = await apiRequest<GoogleAuthResponse>(
    '/usuarios/auth/google/',
    {
      method: 'POST',
      body: { id_token: idToken },
      auth: false, // todavía no tenemos JWT, estamos pidiéndolo
    },
  );

  // Guardamos ambos tokens para que apiRequest los use automáticamente
  await saveTokens(data.access, data.refresh);

  return data.usuario;
}

/**
 * Cierra sesión: borra los tokens locales.
 * No requiere llamada al backend porque JWT es stateless.
 */
export async function logout(): Promise<void> {
  await deleteTokens();
}

// ---------------------------------------------------------------------------
// PERFIL
// ---------------------------------------------------------------------------

/**
 * Trae los datos del usuario autenticado.
 * Útil para verificar si la sesión sigue activa al abrir la app,
 * o para mostrar datos en la pantalla de perfil.
 */
export async function getProfile(): Promise<PerfilUsuario> {
  return apiRequest<PerfilUsuario>('/usuarios/perfil/');
}

// ---------------------------------------------------------------------------
// ASISTENCIA A EVENTOS
// ---------------------------------------------------------------------------

/**
 * Actualiza el estado de asistencia del usuario a un evento.
 *
 * RESTRICCIÓN DEL BACKEND: Solo funciona el mismo día del evento.
 * Si intentas cambiar el estado en otro día, el backend responde 400
 * con el mensaje "Aún no es el día del evento o el evento ya pasó".
 *
 * Estados posibles (el backend los convierte a mayúsculas):
 *   "pendiente" | "en_camino" | "llegue" | "cancelado" | "esperando"
 */
export async function actualizarAsistencia(
  payload: AsistenciaPayload,
): Promise<{ message: string; estado: string }> {
  return apiRequest('/usuarios/mi-asistencia/', {
    method: 'POST',
    body: payload,
  });
}