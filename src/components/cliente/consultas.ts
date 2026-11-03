// Consultas de la app del cliente, armadas con los exports de datos.ts.
// Corren en el servidor sobre la foto del cliente (cargarDatosCliente): solo trae sus locales.

import { controlesDeLocal, datos, describirControl, estadoControl, ORDEN_ESTADO, resumenLocal } from "@/lib/datos";
import { fechaLarga, textoRelativo } from "@/lib/fechas";
import type { Control, EstadoControl } from "@/lib/tipos";

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * El control en una frase: "la recarga de matafuego ABC 5 kg (cocina)", "la limpieza de grasera (patio)",
 * "el control de plagas del local". Sin artículo delante del equipo, para no errarle al género
 * ("del campana"), y sin repetir el equipo si el control ya lo nombra ("limpieza de grasera").
 */
export function nombreLargo(c: Control): string {
  const { que, elemento, donde } = describirControl(c);
  const articulo = /^(recarga|prueba|limpieza|medición|vida)/i.test(que) ? "la" : "el";
  if (!elemento) return `${articulo} ${minuscula(que)} del local`;
  const equipo = minuscula(elemento.tipo);
  const yaLoNombra = minuscula(que).includes(equipo.split(" ")[0]);
  return `${articulo} ${minuscula(que)}${yaLoNombra ? "" : ` de ${equipo}`}${donde ? ` (${minuscula(donde)})` : ""}`;
}

/** Peor estado primero; a igual estado, el que vence antes. */
export function compararControles(a: Control, b: Control) {
  return (
    ORDEN_ESTADO[estadoControl(a)] - ORDEN_ESTADO[estadoControl(b)] ||
    (a.vencimiento ?? "").localeCompare(b.vencimiento ?? "")
  );
}

export interface Veredicto {
  estado: EstadoControl;
  titulo: string; // "Todo al día", "2 controles vencidos"
  detalle: string; // la frase que explica el primero
}

/**
 * La respuesta a "¿está todo al día?", como un cartel: el peor estado manda.
 * El cliente ve todo, incluso lo vencido (D9).
 */
export function veredictoDe(localId: string): Veredicto {
  const r = resumenLocal(localId);
  const cs = controlesDeLocal(localId).slice().sort(compararControles);
  const primero = (e: EstadoControl) => cs.find((c) => estadoControl(c) === e);
  // Si además hay controles que vencen pronto, el cartel lo dice: no queda escondido detrás del peor.
  const ademas = r.pronto ? ` Además, ${plural(r.pronto, "control vence pronto", "controles vencen pronto")}.` : "";

  if (r.total === 0) {
    return {
      estado: "sin_datos",
      titulo: "Todavía sin controles",
      detalle: "SCP está cargando los equipos de tu local. Cuando estén, vas a ver acá cuándo vence cada uno.",
    };
  }
  if (r.vencidos) {
    const c = primero("vencido")!;
    return {
      estado: "vencido",
      titulo: plural(r.vencidos, "control vencido", "controles vencidos"),
      detalle: `${capitalizar(nombreLargo(c))} ${minuscula(textoRelativo(c.vencimiento!))}.${
        r.vencidos > 1 ? " Abajo están todos." : ""
      } Ya figura en la agenda de SCP.${ademas}`,
    };
  }
  if (r.sinDatos) {
    return {
      estado: "sin_datos",
      titulo: plural(r.sinDatos, "control sin fecha", "controles sin fecha"),
      detalle: `SCP todavía no cargó cuándo ${r.sinDatos === 1 ? "vence" : "vencen"}. Hasta que esté la fecha, no se puede saber si está al día.${ademas}`,
    };
  }
  if (r.pronto) {
    const c = primero("pronto")!;
    return {
      estado: "pronto",
      titulo: plural(r.pronto, "control vence pronto", "controles vencen pronto"),
      detalle: `El primero es ${nombreLargo(c)}: ${minuscula(textoRelativo(c.vencimiento!))}, el ${fechaLarga(c.vencimiento!)}.`,
    };
  }
  const proximo = cs.filter((c) => c.vencimiento).sort((a, b) => a.vencimiento!.localeCompare(b.vencimiento!))[0];
  return {
    estado: "al_dia",
    titulo: "Todo al día",
    detalle: proximo
      ? `El próximo vencimiento es ${nombreLargo(proximo)}, el ${fechaLarga(proximo.vencimiento!)}.`
      : "No hay vencimientos próximos.",
  };
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Los locales que ve este cliente, del peor al mejor. */
export function misLocales() {
  return datos()
    .locales.slice()
    .map((l) => ({ local: l, resumen: resumenLocal(l.id) }))
    .sort(
      (a, b) =>
        ORDEN_ESTADO[a.resumen.peor] - ORDEN_ESTADO[b.resumen.peor] ||
        b.resumen.vencidos - a.resumen.vencidos ||
        a.local.nombre.localeCompare(b.local.nombre),
    );
}

/** Adónde vuelve la ficha de un equipo: al inicio si el cliente tiene un solo local, o a ese local. */
export function rutaDelLocal(localId: string): string {
  return datos().locales.length === 1 ? "/c" : `/c/locales/${localId}`;
}
