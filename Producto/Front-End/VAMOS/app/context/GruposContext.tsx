// context/GruposContext.tsx

import { EstadoMiembro, GrupoConMiembros } from "../services/groupApi";
import { createContext, ReactNode, useContext, useState } from "react";

// ─── Mock user id ─────────────────────────────────────────────────────────────
// Cuando haya auth real, esto vendrá del JWT decodificado.
const MOCK_USER_ID = "yo";

const generarId     = () => Math.random().toString(36).substring(2, 12);
const generarCodigo = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// ─── Tipo del contexto ────────────────────────────────────────────────────────
type GruposContextType = {
  misGrupos:         GrupoConMiembros[];
  crearGrupo:        (eventoId: string) => Promise<GrupoConMiembros>;
  unirseAGrupo:      (inviteCode: string, eventoId: string) => Promise<GrupoConMiembros>;
  actualizarEstado:  (grupoId: string, estado: EstadoMiembro) => void;
  getGrupoPorEvento: (eventoId: string) => GrupoConMiembros | undefined;
};

const GruposContext = createContext<GruposContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GruposProvider({ children }: { children: ReactNode }) {
  const [misGrupos, setMisGrupos] = useState<GrupoConMiembros[]>([]);

  // Crea un grupo nuevo para un evento. El usuario queda como primer miembro.
  // TODO Fase 3: reemplazar con createGroup(eventoId) de groupApi.ts
  const crearGrupo = async (eventoId: string): Promise<GrupoConMiembros> => {
    
  // Si ya tiene grupo para este evento, devuelve el existente
    const existente = misGrupos.find(g => g.evento_id === eventoId);
    if (existente) return existente;

  // Si no, crea uno nuevo
    const id  = generarId();
    const now = new Date().toISOString();

    const nuevoGrupo: GrupoConMiembros = {
      id,
      evento_id:      eventoId,
      creador_id:     MOCK_USER_ID,
      invite_code:    generarCodigo(),
      fecha_creacion: now,
      miembros: [{
        id:             generarId(),
        grupo_id:       id,
        usuario_id:     MOCK_USER_ID,
        nombre_usuario: "Tú",
        estado:         "pendiente",
        fecha_union:    now,
        fecha_estado:   now,
      }],
    };

    setMisGrupos(prev => [...prev, nuevoGrupo]);
    return nuevoGrupo;
  };

  // Une al usuario a un grupo existente via invite_code.
  // En el mock simula que ya hay otro miembro en el grupo.
  // TODO Fase 3: reemplazar con joinGroupByCode(inviteCode) de groupApi.ts
  const unirseAGrupo = async (inviteCode: string, eventoId: string): Promise<GrupoConMiembros> => {
    const id  = generarId();
    const now = new Date().toISOString();

    const grupo: GrupoConMiembros = {
      id,
      evento_id:      eventoId,
      creador_id:     "otro_usuario",
      invite_code:    inviteCode,
      fecha_creacion: now,
      miembros: [
        {
          id:             generarId(),
          grupo_id:       id,
          usuario_id:     "otro_usuario",
          nombre_usuario: "Otro usuario",
          estado:         "en_camino",
          fecha_union:    now,
          fecha_estado:   now,
        },
        {
          id:             generarId(),
          grupo_id:       id,
          usuario_id:     MOCK_USER_ID,
          nombre_usuario: "Tú",
          estado:         "pendiente",
          fecha_union:    now,
          fecha_estado:   now,
        },
      ],
    };

    setMisGrupos(prev => [...prev, grupo]);
    return grupo;
  };

  // Cambia el estado del usuario actual dentro de un grupo.
  // TODO Fase 3: también llamar a updateMyStatus(grupoId, estado) de groupApi.ts
  const actualizarEstado = (grupoId: string, estado: EstadoMiembro) => {
    const now = new Date().toISOString();
    setMisGrupos(prev => prev.map(g => {
      if (g.id !== grupoId) return g;
      return {
        ...g,
        miembros: g.miembros.map(m =>
          m.usuario_id === MOCK_USER_ID
            ? { ...m, estado, fecha_estado: now }
            : m
        ),
      };
    }));
  };

  const getGrupoPorEvento = (eventoId: string) =>
    misGrupos.find(g => g.evento_id === eventoId);

  return (
    <GruposContext.Provider value={{ misGrupos, crearGrupo, unirseAGrupo, actualizarEstado, getGrupoPorEvento }}>
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