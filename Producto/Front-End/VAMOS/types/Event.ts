export type Event = {
  id_externo: string;
  nombre_evento: string;
  fecha_evento: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  horario_variable: boolean;
  categoria: string;
  precio: number | null;
  requiere_inscripcion: boolean;
  lugar_texto: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  url_oficial: string;
  estado_evento: string;
  origen_datos: string;
};