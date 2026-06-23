// context/GruposContext.tsx
//
// Fase 3: conectado al backend real.
// Antes todo era mock, ahora cada función llama a groupApi.ts
// que usa apiRequest (con JWT automático).

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  EstadoMiembro,
  GrupoConMiembros,
  createGroup,
  joinGroupByCode,
  getGroupDetail,
  getMyGroups,
  updateMyStatus,
  leaveGroup,
} from "../services/groupApi";
import { useAuth } from "./AuthContext";

// ─── Tipo del contexto ────────────────────────────────────────────────────────
type GruposContextType = {
  misGrupos:         GrupoConMiembros[];
  cargando:          boolean;
  crearGrupo:        (eventoId: string) => Promise<GrupoConMiembros>;
  unirseAGrupo:      (inviteCode: string) => Promise<GrupoConMiembros>;
  actualizarEstado:  (grupoId: string, estado: EstadoMiembro) => Promise<void>;
  salirDeGrupo:      (grupoId: string) => Promise<void>;
  getGrupoPorEvento: (eventoId: string) => GrupoConMiembros | undefined;
  refrescarGrupos:   () => Promise<void>;
};

const GruposContext = createContext<GruposContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GruposProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [misGrupos, setMisGrupos] = useState<GrupoConMiembros[]>([]);
  const [cargando, setCargando]   = useState(false);

  // ── Cargar todos los grupos del usuario ──────────────────────────────────
  // Llama a /grupos/mis-grupos/ y después pide el detalle de cada uno
  // (para traer la lista de miembros).
const refrescarGrupos = useCallback(async () => {
    setCargando(true);
    try {
      const grupos = await getMyGroups();

      // Para cada grupo traemos el detalle con miembros (en paralelo).
      // Si tu backend ya devuelve miembros en mis-grupos/, puedes
      // saltarte este paso y hacer: setMisGrupos(grupos as GrupoConMiembros[])
      const detalles = await Promise.all(
        grupos.map((g) => getGroupDetail(g.id))
      );

      setMisGrupos(detalles);
    } catch (error) {
      console.error("Error cargando grupos:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar grupos apenas monta el provider.
  // Si necesitas esperar a que el usuario esté logueado, puedes importar
  // useAuth y condicionar: if (estaLogueado) refrescarGrupos();
 useEffect(() => {
  if (accessToken) {
    refrescarGrupos();
  } else {
    setMisGrupos([]);
  }
}, [accessToken, refrescarGrupos]);

  // ── Crear grupo ──────────────────────────────────────────────────────────
  const crearGrupo = async (eventoId: string): Promise<GrupoConMiembros> => {
    // Guardia: si ya tiene grupo para este evento, devuelve el existente
    const existente = misGrupos.find((g) => g.evento_id === eventoId);
    if (existente) return existente;

    // POST /grupos/  →  devuelve el grupo creado (sin miembros)
    const nuevoGrupo = await createGroup(eventoId);

    // GET /grupos/{id}/  →  trae el grupo con la lista de miembros
    const detalle = await getGroupDetail(nuevoGrupo.id);

    setMisGrupos((prev) => [...prev, detalle]);
    return detalle;
  };

  // ── Unirse a grupo ───────────────────────────────────────────────────────
  // OJO: ya no recibe eventoId, el backend lo resuelve con el invite_code.
  const unirseAGrupo = async (inviteCode: string): Promise<GrupoConMiembros> => {
    // POST /grupos/unirse/  →  une al usuario y devuelve el grupo
    const grupo = await joinGroupByCode(inviteCode);

    // Traer detalle completo con miembros
    const detalle = await getGroupDetail(grupo.id);

    setMisGrupos((prev) => [...prev, detalle]);
    return detalle;
  };

  // ── Cambiar estado ───────────────────────────────────────────────────────
  const actualizarEstado = async (grupoId: string, estado: EstadoMiembro): Promise<void> => {
    // PATCH /grupos/{id}/estado/  →  devuelve el miembro actualizado
    const miembroActualizado = await updateMyStatus(grupoId, estado);

    // Actualizar solo ese miembro en el estado local
    setMisGrupos((prev) =>
      prev.map((g) => {
        if (g.id !== grupoId) return g;
        return {
          ...g,
          miembros: g.miembros.map((m) =>
            m.usuario_id === miembroActualizado.usuario_id
              ? { ...m, ...miembroActualizado }
              : m
          ),
        };
      })
    );
  };

  // ── Salirse de grupo ─────────────────────────────────────────────────────
  const salirDeGrupo = async (grupoId: string): Promise<void> => {
    // DELETE /grupos/{id}/salir/
    await leaveGroup(grupoId);
    setMisGrupos((prev) => prev.filter((g) => g.id !== grupoId));
  };

  // ── Buscar grupo por evento (sin cambios) ────────────────────────────────
  const getGrupoPorEvento = (eventoId: string) =>
    misGrupos.find((g) => g.evento_id === eventoId);

  return (
    <GruposContext.Provider
      value={{
        misGrupos,
        cargando,
        crearGrupo,
        unirseAGrupo,
        actualizarEstado,
        salirDeGrupo,
        getGrupoPorEvento,
        refrescarGrupos,
      }}
    >
      {children}
    </GruposContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGrupos() {
  const ctx = useContext(GruposContext);
  if (!ctx) throw new Error("useGrupos debe usarse dentro de GruposProvider");
  return ctx;
}