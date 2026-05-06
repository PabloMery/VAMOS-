// app/services/groupApi.ts
//
// Funciones para los grupos logísticos (la app Django `usuarios/` los maneja).

import { Grupo, MiembroGrupo } from '@/types/Group';
import { apiRequest } from './apiClient';

// Estados posibles de un miembro dentro de un grupo (debe coincidir con
// lo que acepte el backend).
export type EstadoMiembro =
  | 'pendiente'
  | 'en_camino'
  | 'llegue'
  | 'cancelado'
  | 'esperando';

// El detalle de un grupo trae también la lista de miembros.
export type GrupoConMiembros = Grupo & {
  miembros: MiembroGrupo[];
};

// ---------------------------------------------------------------------------
// CREAR / UNIRSE
// ---------------------------------------------------------------------------

/**
 * Crea un grupo nuevo asociado a un evento. El backend devuelve el grupo
 * con su `invite_code`, que es lo que se usa en el link copiable.
 */
export async function createGroup(eventoId: string): Promise<Grupo> {
  return apiRequest<Grupo>('/grupos/', {
    method: 'POST',
    body: { evento_id: eventoId },
  });
}

/**
 * Une al usuario actual a un grupo a partir del código del link de invitación.
 * Ese código viene del deep link que se abre con expo-linking.
 */
export async function joinGroupByCode(inviteCode: string): Promise<Grupo> {
  return apiRequest<Grupo>('/grupos/unirse/', {
    method: 'POST',
    body: { invite_code: inviteCode },
  });
}

// ---------------------------------------------------------------------------
// LECTURA
// ---------------------------------------------------------------------------

/** Detalle de un grupo + sus miembros con sus estados actuales. */
export async function getGroupDetail(groupId: string): Promise<GrupoConMiembros> {
  return apiRequest<GrupoConMiembros>(`/grupos/${groupId}/`);
}

/** Todos los grupos en los que está el usuario actual. */
export async function getMyGroups(): Promise<Grupo[]> {
  return apiRequest<Grupo[]>('/grupos/mis-grupos/');
}

// ---------------------------------------------------------------------------
// ACCIONES DENTRO DEL GRUPO
// ---------------------------------------------------------------------------

/** Cambia el estado del usuario actual dentro de un grupo. */
export async function updateMyStatus(
  groupId: string,
  estado: EstadoMiembro
): Promise<MiembroGrupo> {
  return apiRequest<MiembroGrupo>(`/grupos/${groupId}/estado/`, {
    method: 'PATCH',
    body: { estado },
  });
}

/** Salirse de un grupo. */
export async function leaveGroup(groupId: string): Promise<void> {
  await apiRequest<void>(`/grupos/${groupId}/salir/`, {
    method: 'DELETE',
  });
}