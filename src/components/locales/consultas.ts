// Consultas propias de las pantallas de locales. Usan solo lo que exporta datos.ts,
// así cuando llegue Supabase alcanza con cambiar datos.ts.

import {
  clienteDe,
  controles,
  controlesDeLocal,
  describirControl,
  ejecuciones,
  estadoControl,
  informes,
  ORDEN_ESTADO,
  resumenLocal,
  supervisorActual,
  visitasDeLocal,
} from "@/lib/datos";
import { diasEntre, fechaConDia, hoy } from "@/lib/fechas";
import type { EstadoControl, FechaISO, Local, Pedido, ResultadoEjecucion, Visita } from "@/lib/tipos";

export type Resumen = ReturnType<typeof resumenLocal>;

/** El peor estado de una lista (vacía = sin datos: no hay nada cargado). */
export function peorDe(estados: EstadoControl[]): EstadoControl {
  if (estados.length === 0) return "sin_datos";
  return estados.reduce((p, e) => (ORDEN_ESTADO[e] < ORDEN_ESTADO[p] ? e : p));
}

/** Los estados de los controles del local, del peor al mejor: es lo que dibuja la regla. */
export function estadosDeLocal(localId: string): EstadoControl[] {
  return controlesDeLocal(localId)
    .map(estadoControl)
    .sort((a, b) => ORDEN_ESTADO[a] - ORDEN_ESTADO[b]);
}

/** Para ordenar locales: peor estado primero; a igual estado, más vencidos, más sin datos y más por vencer. */
export function compararResumen(a: Resumen, b: Resumen): number {
  const peorA = a.total ? a.peor : "sin_datos";
  const peorB = b.total ? b.peor : "sin_datos";
  return (
    ORDEN_ESTADO[peorA] - ORDEN_ESTADO[peorB] ||
    b.vencidos - a.vencidos ||
    b.sinDatos - a.sinDatos ||
    b.pronto - a.pronto
  );
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Lo más urgente en pocas palabras, y sobre cuántos: "2 vencidos" / "de 13 controles". */
export function textoRegla(r: Resumen): { principal: string; secundario: string } {
  const de = `de ${plural(r.total, "control", "controles")}`;
  if (r.total === 0) return { principal: "Sin controles", secundario: "Falta el relevamiento" };
  if (r.vencidos) return { principal: plural(r.vencidos, "vencido", "vencidos"), secundario: de };
  if (r.sinDatos) return { principal: `${r.sinDatos} sin datos`, secundario: de };
  if (r.pronto) return { principal: plural(r.pronto, "vence pronto", "vencen pronto"), secundario: de };
  return { principal: "Todo al día", secundario: plural(r.total, "control", "controles") };
}

/** Todo el estado en una frase: "2 vencidos, 1 vence pronto y 10 al día." */
export function fraseResumen(r: Resumen): string {
  if (r.total === 0) return "Todavía no hay controles cargados en este local.";
  if (r.alDia === r.total) {
    return r.total === 1 ? "El único control está al día." : `Los ${r.total} controles están al día.`;
  }
  const partes = [
    r.vencidos && plural(r.vencidos, "vencido", "vencidos"),
    r.sinDatos && `${r.sinDatos} sin datos`,
    r.pronto && plural(r.pronto, "vence pronto", "vencen pronto"),
    r.alDia && `${r.alDia} al día`,
  ].filter(Boolean) as string[];
  const texto = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}` : partes[0];
  return `${texto}.`;
}

// ——— Visitas ———

/** La visita abierta más próxima del local (en curso o programada, de hoy en adelante). */
export function proximaVisita(localId: string): Visita | undefined {
  const H = hoy();
  return visitasDeLocal(localId)
    .filter((v) => (v.estado === "en_curso" || v.estado === "programada") && v.fecha >= H)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.estado === "en_curso" ? -1 : 1))[0];
}

/** "Visita en curso, hoy de 9 a 11 h" o "Visita el mié 14 oct". */
export function textoVisita(v: Visita, conFranja = false): string {
  // Espacio duro antes de la "h" para que no quede sola en otra línea.
  const franja = v.franja.replace(/ h$/, "\u00a0h");
  if (v.estado === "en_curso") return `Visita en curso, hoy de ${franja}`;
  const dia = v.fecha === hoy() ? "hoy" : `el ${fechaConDia(v.fecha)}`;
  return `Visita ${dia}${conFranja ? `, de ${franja}` : ""}`;
}

const TIPO_VISITA: Record<Visita["tipo"], string> = {
  preventiva: "preventiva",
  correctiva: "correctiva",
  relevamiento: "de relevamiento",
  obra: "de obra",
};
const ESTADO_VISITA: Record<Visita["estado"], string> = {
  programada: "programada",
  en_curso: "en curso",
  cerrada: "cerrada",
  fallida: "fallida",
};

// ——— Historial ———

export const RESULTADO: Record<ResultadoEjecucion, string> = {
  ok: "Hecho",
  reemplazo: "Se cambió la unidad",
  observado: "Hecho, con observaciones",
  no_apto: "No apto",
  no_realizado: "No se pudo hacer",
};

export type EventoHistorial =
  | {
      clase: "visita";
      id: string;
      fecha: FechaISO;
      titulo: string;
      estado: Visita["estado"];
      franja: string;
      que: string; // "Recarga, limpieza de campana y control de plagas"
      nota?: string;
      informe?: { id: string; numero: string };
    }
  | {
      clase: "ejecucion";
      id: string;
      fecha: FechaISO;
      titulo: string; // "Recarga"
      sobre: string; // "Matafuego ABC 5 kg, salón, junto a la caja"
      elementoId?: string;
      codigo?: string;
      resultado?: ResultadoEjecucion;
      ejecutor?: string;
      oblea?: string;
      vencimientoNuevo?: FechaISO;
      nota?: string;
    };

export interface DiaHistorial {
  fecha: FechaISO;
  eventos: EventoHistorial[];
}

function enumerar(cosas: string[]): string {
  if (cosas.length <= 1) return cosas[0] ?? "";
  return `${cosas.slice(0, -1).join(", ")} y ${cosas.at(-1)}`;
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function sobreDe(controlId: string) {
  const c = controles.find((x) => x.id === controlId)!;
  const { tipo, elemento, sobre, donde } = describirControl(c);
  return {
    titulo: tipo.nombre,
    sobre: elemento ? `${sobre}, ${minuscula(donde ?? "")}` : "Control del local",
    elementoId: elemento?.id,
    codigo: elemento?.codigo,
  };
}

/**
 * Visitas (las que ya pasaron o están en curso) y trabajos registrados, del más nuevo al más viejo,
 * agrupados por día. Las visitas programadas a futuro no son historia: van arriba, en "próxima visita".
 */
export function historialDeLocal(localId: string): DiaHistorial[] {
  const H = hoy();
  const eventos: EventoHistorial[] = [];

  for (const v of visitasDeLocal(localId)) {
    if (v.estado === "programada" && v.fecha >= H) continue;
    const informe = informes.find((i) => i.visitaId === v.id);
    const que = v.controlIds.map((id) => sobreDe(id).titulo);
    const sinRepetir = [...new Set(que)].map((t, i) => (i === 0 ? t : minuscula(t)));
    eventos.push({
      clase: "visita",
      id: v.id,
      fecha: v.fecha,
      titulo: `Visita ${TIPO_VISITA[v.tipo]} ${ESTADO_VISITA[v.estado]}`,
      estado: v.estado,
      franja: v.franja,
      que: enumerar(sinRepetir),
      nota: v.nota,
      informe: informe && { id: informe.id, numero: informe.numero },
    });
  }

  const delLocal = controlesDeLocal(localId);
  const conRegistro = new Set<string>();
  for (const e of ejecuciones) {
    const c = delLocal.find((x) => x.id === e.controlId);
    if (!c) continue;
    conRegistro.add(c.id);
    eventos.push({
      clase: "ejecucion",
      id: e.id,
      fecha: e.fecha,
      ...sobreDe(c.id),
      resultado: e.resultado,
      ejecutor: e.ejecutor,
      oblea: e.oblea,
      vencimientoNuevo: e.vencimientoNuevo,
      nota: e.nota,
    });
  }

  // Controles cuya última ejecución todavía no está en la tabla de ejecuciones (datos de relevamiento).
  // TODO(supabase): con la cadena de vencimientos completa en la base esto sobra; sale todo de `ejecucion`.
  // La vida útil se cuenta desde la fabricación: no es un trabajo y no va al historial.
  for (const c of delLocal) {
    if (conRegistro.has(c.id) || !c.ultimaEjecucion || c.tipoControlId === "tc-vida") continue;
    eventos.push({
      clase: "ejecucion",
      id: `ult-${c.id}`,
      fecha: c.ultimaEjecucion,
      ...sobreDe(c.id),
      ejecutor: c.ultimoEjecutor,
      vencimientoNuevo: c.vencimiento,
    });
  }

  // Más nuevo primero; dentro del mismo día, la visita antes que sus trabajos.
  eventos.sort((a, b) => (a.fecha !== b.fecha ? (a.fecha < b.fecha ? 1 : -1) : a.clase === "visita" ? -1 : 1));

  const dias: DiaHistorial[] = [];
  for (const ev of eventos) {
    const ultimo = dias.at(-1);
    if (ultimo && ultimo.fecha === ev.fecha) ultimo.eventos.push(ev);
    else dias.push({ fecha: ev.fecha, eventos: [ev] });
  }
  return dias;
}

/** "Hoy", "Ayer", "Hace 6 días", "Hace 3 meses", "Hace 2 años". */
export function haceCuanto(fecha: FechaISO, referencia: FechaISO = hoy()): string {
  const d = diasEntre(fecha, referencia);
  if (d <= 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 45) return `Hace ${d} días`;
  const meses = Math.round(d / 30.4);
  if (meses < 12) return `Hace ${meses} meses`;
  const anios = Math.max(1, Math.floor(d / 365));
  return anios === 1 ? "Hace un año" : `Hace ${anios} años`;
}

// ——— Contacto ———

export const primerNombre = (nombre: string) => nombre.split(" ")[0];

export function enlacesContacto(local: Local) {
  const numero = local.encargado.telefono.replace(/[^\d]/g, "");
  const mensaje = `Hola ${primerNombre(local.encargado.nombre)}, te escribe ${primerNombre(supervisorActual.nombre)} de SCP.`;
  return {
    telefono: `tel:+${numero}`,
    whatsapp: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
    // "Ferrari 250, local 214": el número de local confunde al buscador de mapas.
    mapa: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${local.direccion.replace(/,\s*local\s.*$/i, "")}, CABA`,
    )}`,
  };
}

export const clienteDeLocal = (local: Local) => clienteDe(local.clienteId)!;

// ——— Pedidos ———

export const URGENCIA: Record<Pedido["urgencia"], string> = {
  emergencia: "Emergencia",
  urgente: "Urgente",
  normal: "Normal",
};
export const ESTADO_PEDIDO: Record<Pedido["estado"], string> = {
  nuevo: "nuevo",
  aceptado: "aceptado",
  programado: "programado",
  resuelto: "resuelto",
};
const CANAL: Record<Pedido["canal"], string> = {
  portal: "por el portal",
  whatsapp: "por WhatsApp",
  telefono: "por teléfono",
};

/** "hoy a las 8:12", "ayer a las 17:40", "el vie 9 oct a las 10:05" (la hora ya viene en horario de Argentina). */
export function momento(isoConHora: string, referencia: FechaISO = hoy()): string {
  const fecha = isoConHora.slice(0, 10);
  const hora = isoConHora.slice(11, 16).replace(/^0/, "");
  const d = diasEntre(fecha, referencia);
  const dia = d === 0 ? "hoy" : d === 1 ? "ayer" : `el ${fechaConDia(fecha)}`;
  return `${dia} a las ${hora}`;
}

/** "Urgente, nuevo. Llegó por el portal hoy a las 8:12." */
export function detallePedido(p: Pedido): string {
  return `${URGENCIA[p.urgencia]}, ${ESTADO_PEDIDO[p.estado]}. Llegó ${CANAL[p.canal]} ${momento(p.creado)}.`;
}

/** Cuánto le queda al plazo del abono (SLA). Los colores siguen la misma regla que los vencimientos. */
export function plazoPedido(p: Pedido, ahora: number = Date.now()): { estado?: EstadoControl; cifra: string; texto: string } {
  if (p.estado === "resuelto") return { cifra: "Listo", texto: "Resuelto" };
  const horas = (Date.parse(p.slaVence) - ahora) / 3_600_000;
  if (horas < 0) return { estado: "vencido", cifra: fechaCortaConHora(p.slaVence), texto: "Venció el plazo" };
  const estado: EstadoControl = horas <= 24 ? "pronto" : "al_dia";
  if (horas < 1) return { estado, cifra: `${Math.max(1, Math.round(horas * 60))} min`, texto: "de plazo" };
  if (horas < 48) return { estado, cifra: `${Math.floor(horas)} h`, texto: "de plazo" };
  return { estado, cifra: `${Math.floor(horas / 24)} días`, texto: "de plazo" };
}

function fechaCortaConHora(isoConHora: string): string {
  const [, m, d] = isoConHora.slice(0, 10).split("-");
  return `${d}/${m} ${isoConHora.slice(11, 16).replace(/^0/, "")}`;
}
