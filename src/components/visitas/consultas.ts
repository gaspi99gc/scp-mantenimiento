// Consultas de las pantallas de visitas, armadas con los exports de datos.ts.
// Se usan desde las páginas (Server Components); a los componentes cliente les llegan los resultados.

import {
  bloqueoDe,
  controles,
  controlesDeLocal,
  describirControl,
  elementoDe,
  estadoControl,
  informes,
  locales,
  ORDEN_ESTADO,
  resumenLocal,
  tipoDe,
  visitaProgramadaDe,
  visitas,
} from "@/lib/datos";
import { diasEntre, hoy } from "@/lib/fechas";
import type { Control, Elemento, EstadoControl, FechaISO, Local, TipoControl, Visita } from "@/lib/tipos";
import { enumerar } from "./textos";

export type Bloqueo = { texto: string; permiteReemplazo: boolean };

/** Un control tal como lo necesitan las pantallas de visitas (todo serializable). */
export interface ControlVisita {
  control: Control;
  tipo: TipoControl;
  elemento?: Elemento;
  estado: EstadoControl;
  /** "Matafuego ABC 10 kg, cocina, junto a la puerta trasera" o "Control del local" */
  sobre: string;
  bloqueo?: Bloqueo;
  /** Control de prueba hidráulica que, registrado en esta visita, levanta el bloqueo de la recarga. */
  levantaBloqueo?: string;
  /** Visita abierta (programada o en curso) que ya lo incluye. */
  visita?: { id: string; fecha: FechaISO };
}

function sobreDe(c: Control): string {
  const { sobre, donde } = describirControl(c);
  return donde ? `${sobre}, ${donde.charAt(0).toLowerCase()}${donde.slice(1)}` : "Control del local";
}

function aControlVisita(c: Control): ControlVisita {
  const bloqueo = bloqueoDe(c);
  const ph = bloqueo ? controles.find((x) => x.elementoId === c.elementoId && x.tipoControlId === "tc-ph") : undefined;
  const v = visitaProgramadaDe(c.id);
  return {
    control: c,
    tipo: tipoDe(c),
    elemento: c.elementoId ? elementoDe(c.elementoId) : undefined,
    estado: estadoControl(c),
    sobre: sobreDe(c),
    bloqueo,
    levantaBloqueo: ph?.id,
    visita: v ? { id: v.id, fecha: v.fecha } : undefined,
  };
}

/** Peor estado primero; a igual estado, el que vence antes. Los sin fecha van al final de su grupo. */
function porUrgencia(a: ControlVisita, b: ControlVisita) {
  const e = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
  if (e !== 0) return e;
  const fa = a.control.vencimiento ?? "9999";
  const fb = b.control.vencimiento ?? "9999";
  return fa < fb ? -1 : fa > fb ? 1 : 0;
}

/** Los controles planificados de una visita, del más urgente al menos urgente. */
export function controlesDeVisita(visita: Visita): ControlVisita[] {
  return visita.controlIds
    .map((id) => controles.find((c) => c.id === id))
    .filter((c): c is Control => !!c)
    .map(aControlVisita)
    .sort(porUrgencia);
}

/** Todos los controles del local, del más urgente al menos urgente. */
export function controlesParaArmar(localId: string): ControlVisita[] {
  return controlesDeLocal(localId).map(aControlVisita).sort(porUrgencia);
}

/** El borrador de informe de la visita, si ya existe. */
export function informeDeVisita(visitaId: string) {
  return informes.find((i) => i.visitaId === visitaId);
}

// TODO(supabase): la hora de check-in sale de visita.check_in. En los datos de ejemplo no está,
// así que la visita en curso arranca a las 9:12 para que la pantalla muestre un caso real.
const CHECK_IN_EJEMPLO: Record<string, string> = { "vi-1": "9:12" };
export const checkInDe = (visita: Visita): string | undefined => CHECK_IN_EJEMPLO[visita.id];

/** Locales para elegir al armar una visita: el peor estado primero. */
export function localesParaArmar(): {
  local: Local;
  resumen: ReturnType<typeof resumenLocal>;
  proximaVisita?: FechaISO;
}[] {
  return locales
    .map((local) => {
      const proxima = visitas
        .filter((v) => v.localId === local.id && v.estado === "programada" && diasEntre(hoy(), v.fecha) >= 0)
        .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0];
      return { local, resumen: resumenLocal(local.id), proximaVisita: proxima?.fecha };
    })
    .sort(
      (a, b) =>
        ORDEN_ESTADO[a.resumen.peor] - ORDEN_ESTADO[b.resumen.peor] ||
        b.resumen.vencidos + b.resumen.sinDatos - (a.resumen.vencidos + a.resumen.sinDatos) ||
        a.local.nombre.localeCompare(b.local.nombre),
    );
}

/**
 * Lo que pide el local para entrar a trabajar (shoppings: permiso con N horas de anticipación).
 * Devuelve el aviso para mostrar y las horas de anticipación, si se pueden leer del texto.
 */
export function requisitoDeAcceso(
  local: Local,
): { pedido: string; aviso: string; detalle: string; horas?: number } | undefined {
  if (!local.requisitosAcceso) return undefined;
  const m = local.requisitosAcceso.match(/(\d+)\s*h(?:oras)?\s+de anticipación/i);
  const horas = m ? Number(m[1]) : undefined;
  const esShopping = /shopping/i.test(`${local.nombre} ${local.horarioAcceso}`);
  const aQuien = esShopping ? " al shopping" : "";
  const pedido = `Pedí el permiso de trabajo${aQuien}`;
  const aviso = horas ? `${pedido} con ${horas} h de anticipación` : `${pedido} antes de ir`;
  // Lo que piden además del permiso: "nómina con ART".
  const otros = local.requisitosAcceso
    .split(/,\s*|\s+y\s+/)
    .filter((p) => p && !/permiso/i.test(p))
    .map((p) => p.charAt(0).toLowerCase() + p.slice(1));
  const detalle = `${otros.length ? `También piden ${enumerar(otros)}. ` : ""}${local.horarioAcceso}.`;
  return { pedido, aviso, detalle, horas };
}
