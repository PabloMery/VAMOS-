// services/savedEventsApi.ts
//
// Funciones para sincronizar las listas de guardados/confirmados con el backend.
// Endpoints en /api/usuarios/eventos/

import { apiRequest } from "./apiClient";

// Lo que devuelve GET /usuarios/eventos/mis-eventos/
// Son solo los id_externo, no el evento completo.
type MisEventosResponse = {
  saved: string[];
  confirmed: string[];
};

/**
 * Trae los IDs de eventos guardados y confirmados del usuario.
 */
export async function getMisEventos(): Promise<MisEventosResponse> {
  return apiRequest<MisEventosResponse>("/usuarios/eventos/mis-eventos/");
}

/**
 * Guarda o confirma un evento en el backend.
 * tipo: 'saved' = me interesa, 'confirmed' = voy a ir
 */
export async function guardarEvento(
  eventoId: string,
  tipo: "saved" | "confirmed"
): Promise<void> {
  await apiRequest("/usuarios/eventos/guardar/", {
    method: "POST",
    body: { evento_id: eventoId, tipo },
  });
}

// TODO: Pedirle al compañero de backend un endpoint DELETE para quitar
// un evento de las listas. Algo como:
//
//   DELETE /api/usuarios/eventos/guardar/
//   body: { evento_id: "xxx" }
//
// Mientras tanto, removeEvent solo funciona en local (se pierde al cerrar la app).