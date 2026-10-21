// Consultas de la Agenda, armadas con los exports de datos.ts.
// Devuelven objetos planos (solo texto y números) para poder pasarlos a componentes cliente.

import { clienteDe, controles, describirControl, estadoControl, localDe, ORDEN_ESTADO } from "@/lib/datos";
import { fechaCorta, fechaNumerica, hoy, nombreMes, sumarDias, sumarMeses, textoRelativo } from "@/lib/fechas";
import type { Control, EstadoControl, FechaISO } from "@/lib/tipos";
import { mayusculaInicial, minusculaInicial, normalizar } from "./texto";

// ——— Filas de control ———

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
}

export function filaDe(c: Control): FilaControl {
  const { que, elemento } = describirControl(c);
  const local = localDe(c.localId)!;
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
  };
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
    const f = filaDe(c);
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
