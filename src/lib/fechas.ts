// Fechas sin hora (AAAA-MM-DD), en horario de Argentina.
// El recálculo real va a vivir en Postgres; esta versión sirve para las pantallas y es la misma regla.

import type { Control, EstadoControl, FechaISO, TipoControl, UnidadPeriodo } from "./tipos";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function aFecha(iso: FechaISO): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function aISO(f: Date): FechaISO {
  return f.toISOString().slice(0, 10);
}

/** Hoy en Buenos Aires, como AAAA-MM-DD. */
export function hoy(): FechaISO {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

export function sumarDias(iso: FechaISO, dias: number): FechaISO {
  const f = aFecha(iso);
  f.setUTCDate(f.getUTCDate() + dias);
  return aISO(f);
}

/** Suma meses con tope a fin de mes: 31/08 + 6 meses = 28/02 (o 29/02). */
export function sumarMeses(iso: FechaISO, meses: number): FechaISO {
  const f = aFecha(iso);
  const dia = f.getUTCDate();
  const destino = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimoDia));
  return aISO(destino);
}

export function sumarPeriodo(iso: FechaISO, valor: number, unidad: UnidadPeriodo): FechaISO {
  if (unidad === "dia") return sumarDias(iso, valor);
  if (unidad === "mes") return sumarMeses(iso, valor);
  if (unidad === "anio") return sumarMeses(iso, valor * 12);
  return iso; // manual: la fecha la dice el documento
}

/** Días de a hasta b (positivo si b es posterior). */
export function diasEntre(a: FechaISO, b: FechaISO): number {
  return Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / 86_400_000);
}

/** Próximo vencimiento según la regla del tipo de control (§3.3 de la propuesta). */
export function proponerVencimiento(
  tipo: TipoControl,
  fechaEjecucion: FechaISO,
  vencimientoAnterior?: FechaISO,
): FechaISO {
  if (tipo.periodoUnidad === "manual") return fechaEjecucion;
  if (tipo.base === "desde_vencimiento" && vencimientoAnterior) {
    const desdeAnterior = sumarPeriodo(vencimientoAnterior, tipo.periodoValor, tipo.periodoUnidad);
    if (diasEntre(hoy(), desdeAnterior) >= 0) return desdeAnterior;
  }
  return sumarPeriodo(fechaEjecucion, tipo.periodoValor, tipo.periodoUnidad);
}

export function estadoDe(control: Control, tipo: TipoControl, referencia: FechaISO = hoy()): EstadoControl {
  if (!control.vencimiento) return "sin_datos";
  const faltan = diasEntre(referencia, control.vencimiento);
  if (faltan < 0) return "vencido";
  if (faltan <= tipo.anticipacionDias) return "pronto";
  return "al_dia";
}

/** "Vence hoy", "Vence en 6 días", "Venció hace 3 días"... */
export function textoRelativo(vencimiento: FechaISO, referencia: FechaISO = hoy()): string {
  const d = diasEntre(referencia, vencimiento);
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  if (d === -1) return "Venció ayer";
  if (d < 0) return `Venció hace ${-d} días`;
  if (d <= 60) return `Vence en ${d} días`;
  const meses = Math.round(d / 30.4);
  return meses < 24 ? `Vence en ${meses} meses` : `Vence en ${Math.round(meses / 12)} años`;
}

/** 20/11 */
export function fechaCorta(iso: FechaISO): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** 20/11/2026 */
export function fechaNumerica(iso: FechaISO): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** 20 nov 2026 */
export function fechaMedia(iso: FechaISO): string {
  const f = aFecha(iso);
  return `${f.getUTCDate()} ${MESES_CORTOS[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
}

/** vie 20 nov */
export function fechaConDia(iso: FechaISO): string {
  const f = aFecha(iso);
  return `${DIAS_CORTOS[f.getUTCDay()]} ${f.getUTCDate()} ${MESES_CORTOS[f.getUTCMonth()]}`;
}

/** viernes 20 de noviembre */
export function fechaLarga(iso: FechaISO): string {
  const f = aFecha(iso);
  return `${DIAS_LARGOS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES_LARGOS[f.getUTCMonth()]}`;
}

export function nombreMes(iso: FechaISO): string {
  return MESES_LARGOS[aFecha(iso).getUTCMonth()];
}

/** "cada 12 meses", "cada 5 años", "según documento" */
export function textoPeriodo(tipo: TipoControl): string {
  const { periodoValor: v, periodoUnidad: u } = tipo;
  if (u === "manual") return "según documento";
  if (v === 1) return u === "dia" ? "todos los días" : u === "mes" ? "todos los meses" : "todos los años";
  const nombre = u === "dia" ? "días" : u === "mes" ? "meses" : "años";
  return `cada ${v} ${nombre}`;
}

export interface Casilla {
  rotulo: string; // "e", "f"... para meses; "27" para años
  perforada: boolean; // ya transcurrió
  actual: boolean; // período en curso
  final: boolean; // el período en que vence
}

/**
 * La grilla perforada de la tarjeta: una casilla por mes (o por año) del período,
 * desde el último service hasta el vencimiento. Las que ya pasaron quedan perforadas.
 */
export function grillaPeriodo(tipo: TipoControl, control: Control, referencia: FechaISO = hoy()): Casilla[] {
  if (!control.vencimiento || tipo.periodoUnidad === "manual" || tipo.periodoUnidad === "dia") return [];
  const porAnio = tipo.periodoUnidad === "anio";
  const paso = porAnio ? 12 : 1;
  const cantidad = Math.min(tipo.periodoValor, 24);
  const casillas: Casilla[] = [];
  for (let i = cantidad; i >= 1; i--) {
    // casilla i-ésima contando hacia atrás desde el vencimiento
    const inicio = sumarMeses(control.vencimiento, -i * paso);
    const finCasilla = sumarMeses(control.vencimiento, -(i - 1) * paso);
    const f = aFecha(finCasilla);
    casillas.push({
      rotulo: porAnio ? String(f.getUTCFullYear()).slice(2) : MESES_CORTOS[f.getUTCMonth()].charAt(0),
      perforada: finCasilla <= referencia,
      actual: inicio <= referencia && referencia < finCasilla,
      final: i === 1,
    });
  }
  return casillas;
}
