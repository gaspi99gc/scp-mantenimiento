// Consultas propias de las pantallas de locales. Usan solo lo que exporta datos.ts,
// así cuando llegue Supabase alcanza con cambiar datos.ts.

import {
  clienteDe,
  controles,
  controlesDeLocal,
  describirControl,
  ejecuciones,
  estadoControl,
  ORDEN_ESTADO,
  resumenLocal,
  supervisorActual,
} from "@/lib/datos";
import { diasEntre, fechaConDia, hoy } from "@/lib/fechas";
import type { EstadoControl, FechaISO, Local, Pedido, ResultadoEjecucion } from "@/lib/tipos";

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

// ——— Historial ———

export const RESULTADO: Record<ResultadoEjecucion, string> = {
  ok: "Hecho",
  reemplazo: "Se cambió la unidad",
  observado: "Hecho, con observaciones",
  no_apto: "No apto",
  no_realizado: "No se pudo hacer",
};

export interface EventoHistorial {
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
}

export interface DiaHistorial {
  fecha: FechaISO;
  eventos: EventoHistorial[];
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

/** Trabajos registrados en el local, del más nuevo al más viejo, agrupados por día. */
export function historialDeLocal(localId: string): DiaHistorial[] {
  const eventos: EventoHistorial[] = [];

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

  // Más nuevo primero.
  eventos.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

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
