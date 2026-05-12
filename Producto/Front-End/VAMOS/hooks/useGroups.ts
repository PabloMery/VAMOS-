// hooks/useGroups.ts

import { Grupo, MiembroGrupo } from "@/types/Group";

type GrupoConMiembros = Grupo & { miembros: MiembroGrupo[] };

type UseGroupsResult = {
  misGrupos: GrupoConMiembros[];
  loading: boolean;
  error: string | null;
};

export function useGroups(): UseGroupsResult {
  // TODO Fase 3: reemplazar con llamada real a groupApi
  return {
    misGrupos: [],
    loading: false,
    error: null,
  };
}