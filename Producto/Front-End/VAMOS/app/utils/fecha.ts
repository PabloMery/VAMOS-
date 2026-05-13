// utils/fecha.ts

/**
 * Convierte una fecha en formato "YYYY-MM-DD" o "DD-MM-YYYY"
 * a formato legible: "3 Abril", "15 Junio", etc.
 */
export function formatearFecha(fecha?: string): string {
  if (!fecha) return "";

  const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const partes = fecha.split("-");
  const [, mes, dia] = partes[0].length === 4
    ? [partes[0], partes[1], partes[2]]   // YYYY-MM-DD
    : [partes[2], partes[1], partes[0]];  // DD-MM-YYYY

  return `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`;
}