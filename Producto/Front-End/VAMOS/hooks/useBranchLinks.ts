// hooks/useBranchLinks.ts
//
// Hook para manejar deep links de invitación a grupos.
// Usa Expo Linking en vez de Branch.io.
//
// Se usa en _layout.tsx. No necesita cambios en el import:
//   import { useBranchLinks } from "@/hooks/useBranchLinks";
//   useBranchLinks();  // sigue igual
//
// Cuando alguien abre un link tipo vamos://invite?code=NSU51U:
// 1. Expo Linking captura la URL
// 2. Este hook extrae el invite_code
// 3. Llama a unirseAGrupo del contexto
// 4. Navega a la pantalla del grupo

import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useGrupos } from "@/context/GruposContext";
import { useAuth } from "@/context/AuthContext";

/** Extrae los params de una URL de invitación */
function parseInviteURL(url: string) {
  const parsed = Linking.parse(url);

  // Solo procesar links de invitación: vamos://invite?code=XXX
  if (parsed.path !== "invite") return null;

  const code = parsed.queryParams?.code as string | undefined;
  if (!code) return null;

  return {
    inviteCode: code,
    eventoNombre: (parsed.queryParams?.evento_nombre as string) ?? "",
    fechaEvento: (parsed.queryParams?.fecha as string) ?? "",
  };
}

export function useBranchLinks() {
  const router = useRouter();
  const { unirseAGrupo } = useGrupos();
  const { estaLogueado } = useAuth();
  const procesando = useRef(false);

  /** Procesa una URL de invitación */
  const handleURL = async (url: string) => {
    const invite = parseInviteURL(url);
    if (!invite) return;

    // Evitar procesamiento doble
    if (procesando.current) return;
    procesando.current = true;

    console.log("🔗 Link de invitación recibido, código:", invite.inviteCode);

    try {
      // Si no está logueado, avisar
      if (!estaLogueado) {
        Alert.alert(
          "Inicia sesión",
          "Necesitas iniciar sesión para unirte a un grupo.",
          [{ text: "OK" }]
        );
        return;
      }

      // Unirse al grupo
      const grupo = await unirseAGrupo(invite.inviteCode);

      if (grupo) {
        // Navegar a la pantalla del grupo
        router.push({
          pathname: "/grupo/[id]",
          params: {
            id: String(grupo.id),
            eventoNombre: invite.eventoNombre,
            fechaEvento: invite.fechaEvento,
          },
        });
      }
    } catch (err: any) {
      console.error("❌ Error uniéndose al grupo:", err);
      Alert.alert(
        "No se pudo unir",
        err?.message ?? "Hubo un error al unirse al grupo. Intenta de nuevo."
      );
    } finally {
      procesando.current = false;
    }
  };

  useEffect(() => {
    // ── 1. Cold start: la app se abrió desde un link ──
    Linking.getInitialURL().then((url) => {
      if (url) handleURL(url);
    });

    // ── 2. Background: la app ya estaba abierta y recibe un link ──
    const subscription = Linking.addEventListener("url", (event) => {
      handleURL(event.url);
    });

    return () => subscription.remove();
  }, [estaLogueado]);
}