// app/components/Types/Group.ts
//
// Tipos de grupos logísticos y sus miembros.
// Los grupos se crean dentro de la app (no vienen de scraping), por eso
// usan `id` simple en vez de `id_externo` como los eventos.

// Estados posibles de un miembro dentro de un grupo.
// Debe coincidir con los choices del modelo Django.
export type EstadoMiembro =
  | 'pendiente'    // aún no salgo
  | 'en_camino'    // voy en camino
  | 'llegue'       // ya estoy en el lugar
  | 'cancelado'    // ya no voy
  | 'esperando';   // esperando fuera (ej: en la fila)

// Un grupo logístico asociado a un evento.
export type Grupo = {
  id: string;
  evento_id: string;       // referencia al id_externo del evento
  creador_id: string;      // id del usuario que creó el grupo
  invite_code: string;     // código que va en el deep link
  fecha_creacion: string;  // ISO timestamp
};

// Un miembro dentro de un grupo, con su estado actual.
export type MiembroGrupo = {
  id: string;
  grupo_id: string;
  usuario_id: string;
  nombre_usuario: string;  // útil para mostrar en la pantalla del grupo
                           // sin tener que pedir cada usuario por separado
  estado: EstadoMiembro;
  fecha_union: string;     // cuando se unió
  fecha_estado: string;    // cuándo cambió por última vez su estado
};

// Lo que devuelve el detalle de un grupo: el grupo + sus miembros.
// (mismo tipo que tienes en groupApi.ts; se puede importar desde aquí
// si lo prefieres centralizado).
export type GrupoConMiembros = Grupo & {
  miembros: MiembroGrupo[];
};