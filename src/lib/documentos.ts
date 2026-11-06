// Documentos para inspecciones (D23): las cuatro solapas, el catálogo y el estado de cada documento.
// Se puede usar en el servidor y en el navegador. Las consultas a la base están en
// src/components/documentos/consultas.ts.

export type Solapa = "agc" | "hys" | "autoproteccion" | "residuos";

export const SOLAPAS: { clave: Solapa; corto: string; nombre: string }[] = [
  { clave: "agc", corto: "AGC", nombre: "AGC" },
  { clave: "hys", corto: "HyS", nombre: "Protección del Trabajo (HyS)" },
  { clave: "autoproteccion", corto: "Autoprotección", nombre: "Autoprotección y simulacros" },
  { clave: "residuos", corto: "Residuos", nombre: "Residuos" },
];

export const esSolapa = (v: unknown): v is Solapa => SOLAPAS.some((s) => s.clave === v);
export const solapaDe = (v: unknown, otra: Solapa = "agc"): Solapa => (esSolapa(v) ? v : otra);
export const nombreSolapa = (s: Solapa) => SOLAPAS.find((x) => x.clave === s)!.corto;

export type EstadoDocumento = "vigente" | "por_vencer" | "vencido" | "faltante" | "no_aplica" | "a_definir";

export interface TipoDocumento {
  id: string;
  nombre: string;
  grupo?: string; // en AGC: Habilitación, Seguridad, Instalaciones, Higiene, Funcionamiento
  detalle?: string;
  aplica: "siempre" | "de_corresponder";
  periodoValor?: number;
  periodoUnidad?: "dia" | "mes" | "anio" | "manual"; // sin unidad: no vence; manual: según el certificado
  anticipacionDias: number;
  norma?: string;
  aValidar: boolean;
  activo: boolean;
  solapas: { solapa: Solapa; orden: number }[];
}

export interface Documento {
  id: string;
  localId: string;
  tipo: TipoDocumento;
  aplica: boolean | null; // null: "de corresponder" sin definir
  motivoNoAplica?: string;
  estado: EstadoDocumento;
}

/** Mientras no se puedan subir los PDF, lo que aplica está Faltante. */
export function estadoDocumento(aplica: boolean | null): EstadoDocumento {
  if (aplica === false) return "no_aplica";
  if (aplica === null) return "a_definir";
  return "faltante";
}

/** El lugar del documento dentro de una solapa, o undefined si no está en ella. */
export const ordenEn = (tipo: TipoDocumento, solapa: Solapa) => tipo.solapas.find((s) => s.solapa === solapa)?.orden;

/** Los de una solapa, en el orden de la guía. */
export function deSolapa<T extends { tipo: TipoDocumento } | TipoDocumento>(items: T[], solapa: Solapa): T[] {
  const tipo = (x: T) => ("tipo" in x ? x.tipo : x) as TipoDocumento;
  return items
    .filter((x) => ordenEn(tipo(x), solapa) !== undefined)
    .sort((a, b) => ordenEn(tipo(a), solapa)! - ordenEn(tipo(b), solapa)!);
}

/**
 * Agrupa por grupo respetando el orden, solo si todos tienen grupo (como AGC). Si no, un solo bloque:
 * la puesta a tierra trae su grupo de AGC, pero en HyS no hay grupos.
 */
export function porGrupo<T extends { tipo: TipoDocumento } | TipoDocumento>(items: T[]): { grupo?: string; items: T[] }[] {
  const grupoDe = (x: T) => ("tipo" in x ? x.tipo : (x as TipoDocumento)).grupo;
  if (items.length === 0) return [];
  if (!items.every(grupoDe)) return [{ items }];
  const grupos: { grupo?: string; items: T[] }[] = [];
  for (const x of items) {
    const g = grupoDe(x);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.grupo === g) ultimo.items.push(x);
    else grupos.push({ grupo: g, items: [x] });
  }
  return grupos;
}

/** "AGC 13 y HyS 5": dónde aparece el documento y con qué número. */
export function dondeAparece(tipo: TipoDocumento): string {
  const partes = SOLAPAS.filter((s) => ordenEn(tipo, s.clave) !== undefined).map(
    (s) => `${s.corto} ${ordenEn(tipo, s.clave)}`,
  );
  return partes.length > 1 ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}` : (partes[0] ?? "");
}

/** "No vence", "Según el certificado", "Todos los meses", "Cada 6 meses", "Todos los años". */
export function textoVencimiento(tipo: Pick<TipoDocumento, "periodoValor" | "periodoUnidad">): string {
  const { periodoValor: v, periodoUnidad: u } = tipo;
  if (!u) return "No vence";
  if (u === "manual" || !v) return "Según el certificado";
  if (v === 1) return u === "dia" ? "Todos los días" : u === "mes" ? "Todos los meses" : "Todos los años";
  return `Cada ${v} ${u === "dia" ? "días" : u === "mes" ? "meses" : "años"}`;
}

/** Lo pendiente de una lista de documentos, para el resumen de cada solapa. */
export function pendientes(docs: Documento[]) {
  const cuenta = (...e: EstadoDocumento[]) => docs.filter((d) => e.includes(d.estado)).length;
  return {
    total: docs.length,
    faltan: cuenta("faltante", "vencido"),
    porVencer: cuenta("por_vencer"),
    aDefinir: cuenta("a_definir"),
    vigentes: cuenta("vigente"),
  };
}

/** "15 faltan · 3 a definir"; "Al día" si no queda nada pendiente. */
export function frasePendientes(p: ReturnType<typeof pendientes>): string {
  if (p.total === 0) return "Sin documentos activos";
  const partes = [
    p.faltan && `${p.faltan} ${p.faltan === 1 ? "falta" : "faltan"}`,
    p.porVencer && `${p.porVencer} por vencer`,
    p.aDefinir && `${p.aDefinir} a definir`,
  ].filter(Boolean);
  return partes.length ? partes.join(" · ") : "Al día";
}
