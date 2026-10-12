// Consultas del informe. Arman, a partir de datos.ts, todo lo que la pantalla necesita ya resuelto
// (local, cliente, controles con su nuevo vencimiento, verificación), para pasarlo a los componentes cliente.

import {
  clienteDe, controles, controlesDeLocal, ejecuciones, elementoDe, estadoControl, informeDe, localDe, ORDEN_ESTADO,
  supervisores, tipoDe, visitaDe,
} from "@/lib/datos";
import { fechaMedia, proponerVencimiento } from "@/lib/fechas";
import type { Control, EstadoControl, FechaISO, Informe, Local, Subsanacion, Visita } from "@/lib/tipos";

export type Foto = Informe["fotos"][number];
export type Etapa = Foto["etapa"];

export const ETAPAS: { valor: Etapa; texto: string }[] = [
  { valor: "antes", texto: "Antes" },
  { valor: "despues", texto: "Después" },
  { valor: "certificado", texto: "Certificado" },
];

export const textoEtapa = (e: Etapa) => ETAPAS.find((x) => x.valor === e)!.texto;

/** Un control que se hizo en la visita, con el vencimiento que quedó. */
export interface ControlHecho {
  id: string;
  que: string;
  sobre: string;
  donde?: string;
  vencimientoNuevo: FechaISO;
}

/** Lo que estaba en la visita y no se pudo cerrar. Agrupado por elemento. */
export interface ControlPendiente {
  id: string;
  que: string;
  sobre: string;
  donde?: string;
  vencimiento?: FechaISO;
  estado: EstadoControl;
  motivo: string;
}

export interface DatosInforme {
  id: string;
  numero: string;
  estado: "borrador" | "publicado";
  fecha: FechaISO;
  visitaId: string;
  tipoVisita: string;
  local: { id: string; nombre: string; direccion: string; barrio: string };
  cliente: { nombre: string; razonSocial: string; cuit: string };
  supervisor: string;
  encargado: string;
  resumen: string;
  trabajos: string[];
  recomendaciones: string[];
  fotos: Foto[];
  firma?: { nombre: string; dni: string };
  hechos: ControlHecho[];
  pendientes: ControlPendiente[];
  subsanaciones: Subsanacion[];
  verificacion: { huella: string; codigo: string; url: string };
}

const TIPO_VISITA: Record<Visita["tipo"], string> = {
  preventiva: "Visita preventiva",
  correctiva: "Visita correctiva",
  relevamiento: "Relevamiento",
  obra: "Visita de obra",
};

const sinParentesis = (s: string) => s.replace(/\s*\(.*?\)/g, "");
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "a", "a y b", "a, b y c" */
export function unirConY(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/**
 * Huella ficticia de 64 caracteres hexadecimales, estable para cada informe.
 * TODO(supabase): la real es el SHA-256 del PDF, que calcula `publicar_informe(id)`.
 */
export function huellaFicticia(semilla: string): string {
  let h = 2166136261;
  let salida = "";
  for (let vuelta = 0; vuelta < 8; vuelta++) {
    for (const letra of `${semilla}:${vuelta}`) {
      h ^= letra.charCodeAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    salida += h.toString(16).padStart(8, "0");
  }
  return salida;
}

function describir(c: Control) {
  const tipo = tipoDe(c);
  const el = c.elementoId ? elementoDe(c.elementoId) : undefined;
  return { tipo, el, que: tipo.nombre, sobre: el ? el.tipo : "Local", donde: el?.ubicacion };
}

/** Controles que se cerraron en la visita, según las ejecuciones registradas. */
function hechosDeVisita(visitaId: string): ControlHecho[] {
  return ejecuciones
    .filter((e) => e.visitaId === visitaId && e.vencimientoNuevo)
    .map((e) => {
      const c = controles.find((x) => x.id === e.controlId)!;
      const { que, sobre, donde } = describir(c);
      return { id: c.id, que, sobre, donde, vencimientoNuevo: e.vencimientoNuevo! };
    });
}

/**
 * Contenido de ejemplo para un borrador vacío.
 * La visita de ejemplo no tiene ejecuciones cargadas, así que se simula lo que habría dejado el modo visita:
 * los controles de elementos que están en el taller quedan pendientes; el resto se hizo el día de la visita.
 * TODO(supabase): el borrador lo arma la base al cerrar la visita, con las ejecuciones, trabajos, fotos y firma reales.
 */
function ejemploBorrador(visita: Visita, local: Local) {
  const cs = visita.controlIds.map((id) => controles.find((c) => c.id === id)).filter((c): c is Control => !!c);

  const hechos: ControlHecho[] = [];
  const enTaller = new Map<string, Control[]>();
  for (const c of cs) {
    const { tipo, el, que, sobre, donde } = describir(c);
    if (el?.estado === "en_servicio_externo") {
      enTaller.set(el.id, [...(enTaller.get(el.id) ?? []), c]);
      continue;
    }
    hechos.push({ id: c.id, que, sobre, donde, vencimientoNuevo: proponerVencimiento(tipo, visita.fecha, c.vencimiento) });
  }

  const pendientes: ControlPendiente[] = [...enTaller.values()].map((lista) => {
    const { sobre, donde } = describir(lista[0]);
    const nombres = lista.map((c) => tipoDe(c).nombre);
    const estados = lista.map(estadoControl);
    const vencimientos = lista.map((c) => c.vencimiento).filter((v): v is FechaISO => !!v).sort();
    return {
      id: lista.map((c) => c.id).join("+"),
      que: unirConY(nombres.map((n, i) => (i === 0 ? n : minuscula(n)))),
      sobre,
      donde,
      vencimiento: vencimientos[0],
      estado: estados.reduce((p, e) => (ORDEN_ESTADO[e] < ORDEN_ESTADO[p] ? e : p), "al_dia" as EstadoControl),
      motivo: visita.nota ?? "Quedó para la próxima visita.",
    };
  });

  // Resumen armado con lo que se hizo y lo que quedó pendiente
  const listaHechos = hechos.map((h) => {
    const sobre = sinParentesis(h.sobre);
    const yaLoDice = h.sobre === "Local" || minuscula(h.que).includes(sobre.split(" ")[0].toLowerCase());
    return yaLoDice ? minuscula(h.que) : `${minuscula(h.que)} (${minuscula(sobre)})`;
  });
  let resumen =
    hechos.length === 0
      ? "No se cerró ningún control en esta visita."
      : `Se ${hechos.length === 1 ? "hizo 1 control" : `hicieron ${hechos.length} controles`}: ${unirConY(listaHechos)}. ${
          hechos.length === 1 ? "Quedó al día." : "Quedaron al día."
        }`;
  for (const p of pendientes) {
    resumen += ` Quedó pendiente: ${minuscula(p.que)} del ${minuscula(sinParentesis(p.sobre))}${
      p.donde ? ` (${minuscula(p.donde)})` : ""
    }. ${p.motivo}`;
  }

  // Recomendaciones que salen de los datos del local
  const recomendaciones: string[] = [];
  for (const c of controlesDeLocal(local.id)) {
    const { tipo, el } = describir(c);
    if (tipo.id === "tc-vida" && c.vencimiento && el?.unidad && c.vencimiento < `${Number(visita.fecha.slice(0, 4)) + 2}-12-31`) {
      recomendaciones.push(
        `El ${minuscula(el.tipo)} (${minuscula(el.ubicacion)}) se fabricó en ${el.unidad.fabricacion.slice(0, 4)} y su vida útil termina el ${fechaMedia(c.vencimiento)}. Conviene presupuestar el reemplazo.`,
      );
    }
    if (!c.vencimiento && !visita.controlIds.includes(c.id)) {
      const sobre = el ? `del ${minuscula(sinParentesis(el.tipo))} (${minuscula(el.ubicacion)})` : "del local";
      recomendaciones.push(
        `No tenemos el último certificado de ${minuscula(tipo.nombre)} ${sobre}. Si lo tenés, mandanos una foto; si no, lo programamos.`,
      );
    }
  }

  return {
    resumen,
    hechos,
    pendientes,
    recomendaciones,
    trabajos: ["Cambio de 2 tubos LED en el pasillo de salida", "Ajuste de la bisagra de la puerta de la cámara de frío"],
    fotos: [
      { id: "f1", epigrafe: "Campana antes de la limpieza", etapa: "antes", visibleCliente: true },
      { id: "f2", epigrafe: "Campana después de la limpieza", etapa: "despues", visibleCliente: true },
      { id: "f3", epigrafe: "Prueba de las luces de emergencia del salón", etapa: "despues", visibleCliente: false },
      { id: "f4", epigrafe: "Tarjeta del matafuego sustituto C-700112", etapa: "certificado", visibleCliente: true },
      { id: "f5", epigrafe: "Certificado de Fumigadora Sur", etapa: "certificado", visibleCliente: true },
    ] satisfies Foto[],
    firma: { nombre: local.encargado.nombre, dni: "24.716.358" },
  };
}

export function datosInforme(id: string): DatosInforme | undefined {
  const informe = informeDe(id);
  if (!informe) return undefined;
  const local = localDe(informe.localId);
  const visita = visitaDe(informe.visitaId);
  if (!local || !visita) return undefined;
  const cliente = clienteDe(local.clienteId);
  if (!cliente) return undefined;

  const vacio = informe.estado === "borrador" && !informe.resumen && informe.fotos.length === 0;
  const ejemplo = vacio ? ejemploBorrador(visita, local) : undefined;
  const huella = huellaFicticia(informe.numero);

  return {
    id: informe.id,
    numero: informe.numero,
    estado: informe.estado,
    fecha: informe.fecha,
    visitaId: visita.id,
    tipoVisita: TIPO_VISITA[visita.tipo],
    local: { id: local.id, nombre: local.nombre, direccion: local.direccion, barrio: local.barrio },
    cliente: { nombre: cliente.nombre, razonSocial: cliente.razonSocial, cuit: cliente.cuit },
    supervisor: supervisores.find((s) => s.id === visita.supervisorId)?.nombre ?? "",
    encargado: local.encargado.nombre,
    resumen: ejemplo?.resumen ?? informe.resumen,
    trabajos: ejemplo?.trabajos ?? informe.trabajos,
    recomendaciones: ejemplo?.recomendaciones ?? informe.recomendaciones,
    fotos: ejemplo?.fotos ?? informe.fotos,
    firma: ejemplo?.firma ?? informe.firma,
    hechos: ejemplo?.hechos ?? hechosDeVisita(visita.id),
    pendientes: ejemplo?.pendientes ?? [],
    subsanaciones: informe.subsanaciones,
    verificacion: { huella, codigo: huella.slice(0, 8), url: `scp.com.ar/v/${huella.slice(0, 8)}` },
  };
}
