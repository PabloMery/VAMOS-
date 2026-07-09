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

const MESES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Devuelve texto tipo "10, 17, 24 jul" o "24 jul, 7 ago" (máx 4 fechas)
// y cuántas quedaron sin mostrar.
export function formatearFechasRepeticion(
  fechas: string[],
  max = 4,
): { texto: string; extra: number } {
  if (!fechas || fechas.length === 0) return { texto: "", extra: 0 };

  const parsed = fechas.map((f) => {
    const partes = f.split("-").map(Number);
    const [, mes, dia] = partes[0] > 31
      ? [partes[0], partes[1], partes[2]]         // YYYY-MM-DD
      : [partes[2], partes[1], partes[0]];        // DD-MM-YYYY
    return { dia, mes: mes - 1 };
  });

  const visibles = parsed.slice(0, max);
  const extra = parsed.length - visibles.length;

  // Agrupa corridas consecutivas del mismo mes
  const bloques: string[] = [];
  let dias: number[] = [];
  let mesActual = -1;
  const cerrarBloque = () => {
    if (dias.length === 0) return;
    bloques.push(`${dias.join(", ")} ${MESES_CORTO[mesActual]}`);
    dias = [];
  };
  for (const p of visibles) {
    if (p.mes !== mesActual) {
      cerrarBloque();
      mesActual = p.mes;
    }
    dias.push(p.dia);
  }
  cerrarBloque();

  return { texto: bloques.join(", "), extra };
}

// Devuelve la primera fecha >= hoy del array (formato "YYYY-MM-DD" o "DD-MM-YYYY").
// Si todas ya pasaron, devuelve la última.
// Si el array está vacío o es undefined, devuelve undefined.
export function proximaFecha(fechas?: string[]): string | undefined {
  if (!fechas || fechas.length === 0) return undefined;

  const aDate = (f: string): Date => {
    const partes = f.split("-").map(Number);
    const [year, month, day] = partes[0] > 31
      ? partes
      : [partes[2], partes[1], partes[0]];
    return new Date(year, month - 1, day);
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const futuras = fechas.filter((f) => aDate(f) >= hoy);
  if (futuras.length > 0) return futuras[0];
  return fechas[fechas.length - 1];
}