// Consultas de la pantalla de elementos, armadas con los exports de datos.ts.
// Solo se usan en el servidor (páginas); los componentes cliente importan únicamente los tipos.
// TODO(supabase): estas funciones pasan a ser consultas a la base con las mismas firmas.

import QRCode from "qrcode";
import {
  bloqueoDe,
  controlesDeElemento,
  ejecucionesDeControl,
  elementos,
  estadoControl,
  localDe,
  ORDEN_ESTADO,
  tipoDe,
} from "@/lib/datos";
import type { Control, Ejecucion, Elemento, EstadoControl, FechaISO, ResultadoEjecucion, TipoControl } from "@/lib/tipos";

/** Dominio que va impreso en las etiquetas. Provisorio hasta tener el dominio propio (D1). */
export const DOMINIO_ETIQUETAS = "https://scp.com.ar";

export const urlDeEtiqueta = (qrToken: string) => `${DOMINIO_ETIQUETAS}/e/${qrToken}`;

export interface ControlDeFicha {
  control: Control;
  tipo: TipoControl;
  bloqueo?: { texto: string; permiteReemplazo: boolean };
}

export interface ItemHistorial {
  id: string;
  fecha: FechaISO;
  control: string;
  resultado: ResultadoEjecucion;
  ejecutor: string;
  vencimientoNuevo?: FechaISO;
  origen: Ejecucion["origen"];
  oblea?: string;
  nota?: string;
}

const porVencimiento = (a: Control, b: Control) =>
  (a.vencimiento ?? "0000") < (b.vencimiento ?? "0000") ? -1 : (a.vencimiento ?? "0000") > (b.vencimiento ?? "0000") ? 1 : 0;

/** Controles del elemento, peor estado primero (y dentro del mismo estado, el que vence antes). */
export function controlesDeFicha(elementoId: string): ControlDeFicha[] {
  return controlesDeElemento(elementoId)
    .slice()
    .sort((a, b) => ORDEN_ESTADO[estadoControl(a)] - ORDEN_ESTADO[estadoControl(b)] || porVencimiento(a, b))
    .map((control) => ({
      control,
      tipo: tipoDe(control),
      bloqueo: bloqueoDe(control),
    }));
}

/** Todas las ejecuciones de todos los controles del elemento, la más reciente primero. */
export function historialDeElemento(elementoId: string): ItemHistorial[] {
  return controlesDeElemento(elementoId)
    .flatMap((c) =>
      ejecucionesDeControl(c.id).map((e) => ({
        id: e.id,
        fecha: e.fecha,
        control: tipoDe(c).nombre,
        resultado: e.resultado,
        ejecutor: e.ejecutor,
        vencimientoNuevo: e.vencimientoNuevo,
        origen: e.origen,
        oblea: e.oblea,
        nota: e.nota,
      })),
    )
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}

/** El control que peor está: define la cinta del elemento en una lista. */
export function peorControl(elementoId: string): { estado: EstadoControl; control?: Control } {
  const cs = controlesDeElemento(elementoId)
    .slice()
    .sort((a, b) => ORDEN_ESTADO[estadoControl(a)] - ORDEN_ESTADO[estadoControl(b)] || porVencimiento(a, b));
  return cs.length ? { estado: estadoControl(cs[0]), control: cs[0] } : { estado: "sin_datos" };
}

export const elementoPorToken = (token: string) => elementos.find((e) => e.qrToken === token.trim().toLowerCase());

const normalizar = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * Busca por código del elemento (ESP1-MAT-01, con o sin guiones), por token del QR
 * o por la dirección completa que trae la etiqueta (scp.com.ar/e/q7f3k2).
 */
export function buscarElemento(texto: string): Elemento | undefined {
  const t = texto.trim();
  if (!t) return undefined;
  const token = (t.match(/\/e\/([a-z0-9]+)\/?$/i)?.[1] ?? t).toLowerCase();
  const codigo = normalizar(t);
  return elementos.find((e) => normalizar(e.codigo) === codigo || e.qrToken === token);
}

/** Códigos que se parecen a lo que se escribió, para cuando no hay coincidencia exacta. */
export function codigosParecidos(texto: string, max = 4): Elemento[] {
  const t = normalizar(texto);
  if (t.length < 2) return [];
  return elementos.filter((e) => normalizar(e.codigo).includes(t)).slice(0, max);
}

export function nombreLocal(localId: string) {
  return localDe(localId)?.nombre ?? "";
}

/**
 * El QR de la etiqueta como SVG. Se genera en el servidor; se le saca el fondo blanco y el trazo
 * toma el color del texto, así la etiqueta usa los tokens del diseño (tinta sobre papel).
 */
export async function svgDelQR(url: string): Promise<string> {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
  return svg
    .replace(/<path fill="#ffffff"[^>]*\/>/, "")
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace("<svg ", '<svg width="100%" height="100%" aria-hidden="true" ');
}
