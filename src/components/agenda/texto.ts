// Utilidades de texto sin dependencias de datos: se pueden usar en el servidor y en el cliente.

/** Minúsculas y sin tildes, para buscar sin que importe cómo se escribió. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function mayusculaInicial(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function minusculaInicial(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** "1 control", "4 controles" */
export function cantidad(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
