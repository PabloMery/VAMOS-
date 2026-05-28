// utils/branchLinks.ts
//
// Comparte invitaciones a grupos usando Share nativo.
// El receptor copia el código y lo pega en el modal "Unirse a grupo".

import { Share } from "react-native";

type InviteLinkParams = {
  inviteCode: string;
  eventoId: string;
  eventoNombre: string;
  fechaEvento: string;
  grupoId: string;
};

/**
 * Comparte un mensaje de invitación al grupo con el código.
 * El receptor abre la app → "Unirse a grupo" → pega el código.
 */
export async function compartirInvitacion(params: InviteLinkParams): Promise<void> {
  const { inviteCode, eventoNombre } = params;

  await Share.share({
    message:
      `¡Vamos juntos a ${eventoNombre}!\n\n` +
      `Únete a mi grupo en Vamos?!\n` +
      `Abre la app → Mis Eventos → "Unirse a grupo"\n\n` +
      `Código: ${inviteCode}`,
  });
}