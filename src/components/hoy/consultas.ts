// Consultas de las pantallas Hoy y Agenda, armadas con los exports de datos.ts.
// Devuelven objetos planos (solo texto y números) para poder pasarlos a componentes cliente.

import {
  clienteDe, controles, describirControl, ejecuciones, estadoControl, localDe, locales, ORDEN_ESTADO, pedidos,
  supervisorActual, visitaProgramadaDe, visitas,
} from "@/lib/datos";
import {
  diasEntre, fechaConDia, fechaCorta, fechaLarga, fechaNumerica, hoy, nombreMes, sumarDias, sumarMeses, textoRelativo,
} from "@/lib/fechas";
import type { Control, EstadoControl, FechaISO, Local, Pedido, Visita } from "@/lib/tipos";
import { mayusculaInicial, minusculaInicial, normalizar } from "./texto";

// ——— Filas de control ———

export interface VisitaDeFila {
  id: string;
  /** "Visita en curso", "Visita hoy", "Visita el mié 14 oct" */
  texto: string;
}

export interface FilaControl {
  id: string;
  estado: EstadoControl;
  /** Nombre del control: "Recarga" */
  que: string;
  /** Elemento y ubicación: "Matafuego ABC 5 kg, salón, junto a la caja", o "Todo el local" */
  sobre: string;
  /** Solo el tipo de elemento, sin ubicación. Vacío si es control del local. */
  elemento?: string;
  localId: string;
  local: string;
  barrio: string;
  vencimiento?: FechaISO;
  href: string;
  visita?: VisitaDeFila;
}

export function textoVisita(v: Visita, referencia: FechaISO = hoy()): string {
  if (v.estado === "en_curso") return "Visita en curso";
  if (v.fecha === referencia) return `Visita hoy, ${v.franja}`;
  return `Visita el ${fechaConDia(v.fecha)}`;
}

export function filaDe(c: Control, referencia: FechaISO = hoy()): FilaControl {
  const { que, elemento } = describirControl(c);
  const local = localDe(c.localId)!;
  const v = visitaProgramadaDe(c.id);
  return {
    id: c.id,
    estado: estadoControl(c),
    que,
    sobre: elemento ? `${elemento.tipo}, ${minusculaInicial(elemento.ubicacion)}` : "Todo el local",
    elemento: elemento?.tipo,
    localId: local.id,
    local: local.nombre,
    barrio: local.barrio,
    vencimiento: c.vencimiento,
    href: c.elementoId ? `/s/elementos/${c.elementoId}` : `/s/locales/${c.localId}`,
    visita: v ? { id: v.id, texto: textoVisita(v, referencia) } : undefined,
  };
}

/** Más urgente primero: fecha más vieja, después peor estado, después por nombre. */
function compararFilas(a: FilaControl, b: FilaControl): number {
  if (a.vencimiento && b.vencimiento && a.vencimiento !== b.vencimiento) return a.vencimiento < b.vencimiento ? -1 : 1;
  if (!!a.vencimiento !== !!b.vencimiento) return a.vencimiento ? -1 : 1;
  const e = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
  if (e !== 0) return e;
  return a.que.localeCompare(b.que, "es");
}

// ——— Agrupado por local (Hoy) ———

export interface GrupoLocal {
  local: Pick<Local, "id" | "nombre" | "barrio">;
  filas: FilaControl[];
  /** Si todos los controles del grupo ya están en la misma visita armada. */
  visita?: VisitaDeFila;
}

/** Agrupa por local. El grupo más urgente (fecha más vieja; si empatan, el de más controles) va primero. */
export function agruparPorLocal(filas: FilaControl[]): GrupoLocal[] {
  const porLocal = new Map<string, FilaControl[]>();
  for (const f of filas) porLocal.set(f.localId, [...(porLocal.get(f.localId) ?? []), f]);

  const grupos: GrupoLocal[] = [...porLocal.entries()].map(([localId, fs]) => {
    const ordenadas = [...fs].sort(compararFilas);
    const primera = ordenadas[0].visita;
    const todasEnLaMisma = !!primera && ordenadas.every((f) => f.visita?.id === primera.id);
    const local = localDe(localId)!;
    return {
      local: { id: local.id, nombre: local.nombre, barrio: local.barrio },
      filas: ordenadas,
      visita: todasEnLaMisma ? primera : undefined,
    };
  });

  return grupos.sort((a, b) => {
    const c = compararFilas(a.filas[0], b.filas[0]);
    return c !== 0 ? c : b.filas.length - a.filas.length;
  });
}

// ——— Hoy ———

export interface VisitaEnCurso {
  id: string;
  local: Pick<Local, "nombre" | "direccion" | "barrio">;
  franja: string;
  controles: number;
  registrados: number;
  vencidos: number;
}

export interface VisitaProxima {
  id: string;
  fecha: FechaISO;
  franja: string;
  local: string;
  barrio: string;
  controles: number;
  requisitosAcceso?: string;
}

export interface PedidoAbierto {
  id: string;
  titulo: string;
  localId: string;
  local: string;
  urgencia: Pedido["urgencia"];
  plazo: { texto: string; cifra: string; vencido: boolean };
}

const ORDEN_URGENCIA: Record<Pedido["urgencia"], number> = { emergencia: 0, urgente: 1, normal: 2 };

/** "Quedan 22 h", "Quedan 3 días", "Venció hace 2 h". Se redondea para abajo: mejor que sobre tiempo. */
export function plazoDe(p: Pedido, ahora: number = Date.now()): PedidoAbierto["plazo"] {
  const minutos = Math.floor((new Date(p.slaVence).getTime() - ahora) / 60_000);
  if (minutos < 0) {
    const horas = Math.floor(-minutos / 60);
    return { texto: "Venció hace", cifra: horas < 1 ? `${-minutos} min` : `${horas} h`, vencido: true };
  }
  if (minutos < 60) return { texto: "Quedan", cifra: `${minutos} min`, vencido: false };
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return { texto: horas === 1 ? "Queda" : "Quedan", cifra: `${horas} h`, vencido: false };
  return { texto: "Quedan", cifra: `${Math.floor(horas / 24)} días`, vencido: false };
}

export function datosHoy(referencia: FechaISO = hoy()) {
  const sup = supervisorActual.id;
  // "Hoy" es lo de mi cartera: los locales de los que soy responsable (D10) y mis visitas.
  const misLocales = new Set(locales.filter((l) => l.supervisorId === sup).map((l) => l.id));
  const filas = controles.filter((c) => misLocales.has(c.localId)).map((c) => filaDe(c, referencia));

  const vencidas = filas.filter((f) => f.estado === "vencido");
  const enSieteDias = filas.filter((f) => {
    if (!f.vencimiento || f.estado === "vencido" || f.estado === "suspendido") return false;
    const d = diasEntre(referencia, f.vencimiento);
    return d >= 0 && d <= 7;
  });

  const enCurso: VisitaEnCurso[] = visitas
    .filter((v) => v.estado === "en_curso" && v.supervisorId === sup)
    .map((v) => {
      const local = localDe(v.localId)!;
      const ids = new Set(v.controlIds);
      return {
        id: v.id,
        local: { nombre: local.nombre, direccion: local.direccion, barrio: local.barrio },
        franja: v.franja,
        controles: v.controlIds.length,
        // TODO(supabase): contar las ejecuciones de la visita desde la base.
        registrados: ejecuciones.filter((e) => e.visitaId === v.id && ids.has(e.controlId)).length,
        vencidos: controles.filter((c) => ids.has(c.id) && estadoControl(c) === "vencido").length,
      };
    });

  const proximasVisitas: VisitaProxima[] = visitas
    .filter((v) => v.estado === "programada" && v.supervisorId === sup && v.fecha >= referencia)
    .sort((a, b) => (a.fecha === b.fecha ? a.franja.localeCompare(b.franja) : a.fecha < b.fecha ? -1 : 1))
    .map((v) => {
      const local = localDe(v.localId)!;
      return {
        id: v.id,
        fecha: v.fecha,
        franja: v.franja,
        local: local.nombre,
        barrio: local.barrio,
        controles: v.controlIds.length,
        requisitosAcceso: local.requisitosAcceso,
      };
    });

  const ahora = Date.now();
  const pedidosAbiertos: PedidoAbierto[] = pedidos
    .filter((p) => p.estado !== "resuelto" && misLocales.has(p.localId))
    .sort((a, b) => ORDEN_URGENCIA[a.urgencia] - ORDEN_URGENCIA[b.urgencia] || (a.slaVence < b.slaVence ? -1 : 1))
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      localId: p.localId,
      local: localDe(p.localId)!.nombre,
      urgencia: p.urgencia,
      plazo: plazoDe(p, ahora),
    }));

  // Para el vacío: el primer vencimiento después de la semana.
  const siguiente = filas
    .filter((f) => f.vencimiento && diasEntre(referencia, f.vencimiento) > 7)
    .sort(compararFilas)[0];

  return {
    vencidas,
    enSieteDias,
    gruposVencidos: agruparPorLocal(vencidas),
    gruposSemana: agruparPorLocal(enSieteDias),
    enCurso,
    proximasVisitas,
    pedidosAbiertos,
    siguiente,
  };
}

/** "Lo próximo vence el viernes 20 de noviembre: recarga de matafuego ABC 5 kg en La Espiga Caballito." */
export function describirSiguiente(f: FilaControl): string {
  const sobre = f.elemento ? ` de ${minusculaInicial(f.elemento)}` : "";
  return `Lo próximo vence el ${fechaLarga(f.vencimiento!)}: ${minusculaInicial(f.que)}${sobre} en ${f.local}.`;
}

// ——— Agenda ———

export interface FilaAgenda extends FilaControl {
  periodo: { clave: string; titulo: string };
  /** Fecha para la columna derecha: "18/10", o "10/03/2029" si es de otro año. */
  fecha?: string;
  /** "Venció hace 4 días", "Vence en 6 días", "Al día", "Falta cargar la fecha" */
  relativo: string;
  busqueda: string;
  /** Clave de orden: período, fecha y estado. */
  orden: string;
}

/** Día de la semana ISO: lunes = 1 … domingo = 7. */
function diaSemana(iso: FechaISO): number {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Período de la agenda: vencidos, esta semana (hasta el domingo), la próxima, después por mes y, pasado un año, "Más adelante". */
export function periodoDe(fecha: FechaISO | undefined, referencia: FechaISO): { clave: string; titulo: string } {
  if (!fecha) return { clave: "9-sin-datos", titulo: "Sin datos" };
  if (fecha < referencia) return { clave: "0-vencidos", titulo: "Vencidos" };
  const domingo = sumarDias(referencia, 7 - diaSemana(referencia));
  if (fecha <= domingo) return { clave: "1-esta-semana", titulo: "Esta semana" };
  if (fecha <= sumarDias(domingo, 7)) return { clave: "2-proxima-semana", titulo: "Próxima semana" };
  // Más allá de un año, el detalle por mes ya no ayuda a planificar.
  const inicioMes = `${referencia.slice(0, 7)}-01`;
  if (fecha >= sumarMeses(inicioMes, 12)) return { clave: "8-mas-adelante", titulo: "Más adelante" };
  const anio = fecha.slice(0, 4);
  const mes = mayusculaInicial(nombreMes(fecha));
  const mismoMes = fecha.slice(0, 7) === referencia.slice(0, 7);
  const titulo = mismoMes ? `Resto de ${nombreMes(fecha)}` : anio === referencia.slice(0, 4) ? mes : `${mes} de ${anio}`;
  return { clave: `3-${fecha.slice(0, 7)}`, titulo };
}

export function datosAgenda(referencia: FechaISO = hoy()) {
  const filas: FilaAgenda[] = controles.map((c) => {
    const f = filaDe(c, referencia);
    const periodo = periodoDe(c.vencimiento, referencia);
    const local = localDe(c.localId)!;
    const cliente = clienteDe(local.clienteId);
    const { elemento } = describirControl(c);
    const relativo = !c.vencimiento
      ? "Falta cargar la fecha"
      : f.estado === "vencido" || f.estado === "pronto"
        ? textoRelativo(c.vencimiento, referencia)
        : f.estado === "suspendido"
          ? "Suspendido"
          : "Al día";
    const fecha = c.vencimiento
      ? c.vencimiento.slice(0, 4) === referencia.slice(0, 4)
        ? fechaCorta(c.vencimiento)
        : fechaNumerica(c.vencimiento)
      : undefined;
    return {
      ...f,
      periodo,
      fecha,
      relativo,
      busqueda: normalizar(
        [f.que, f.sobre, elemento?.codigo, f.local, f.barrio, local.direccion, cliente?.nombre].filter(Boolean).join(" "),
      ),
      orden: `${periodo.clave}|${c.vencimiento ?? `~${f.local}`}|${ORDEN_ESTADO[f.estado]}|${f.que}`,
    };
  });
  filas.sort((a, b) => (a.orden < b.orden ? -1 : a.orden > b.orden ? 1 : 0));
  return { filas, locales: new Set(filas.map((f) => f.localId)).size };
}
